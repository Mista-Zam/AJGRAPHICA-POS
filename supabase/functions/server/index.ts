import { withSupabase } from "npm:@supabase/server/adapters/hono"
import { Hono } from "npm:hono"
import { cors } from "npm:hono/cors"
import { logger } from "npm:hono/logger"

const app = new Hono()

app.use("*", logger(console.log))
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
)

const authed = new Hono()
authed.use(
  withSupabase({
    auth: ["user", "publishable", "secret"],
  }),
)

authed.get("/health", (c) => c.json({ status: "ok" }))

authed.get("/services", async (c) => {
  const ctx = c.get("supabaseContext")
  const { data } = await ctx.supabase.from("services").select("*")
  return c.json(data)
})

authed.get("/jobbings", async (c) => {
  const ctx = c.get("supabaseContext")
  const { data } = await ctx.supabase
    .from("jobbings")
    .select("*")
    .order("created_at", { ascending: false })
  return c.json(data)
})

authed.post("/jobbings", async (c) => {
  const ctx = c.get("supabaseContext")
  const body = await c.req.json()
  const { data } = await ctx.supabase
    .from("jobbings")
    .insert(body)
    .select()
    .single()
  return c.json(data, 201)
})

authed.put("/jobbings/:id", async (c) => {
  const ctx = c.get("supabaseContext")
  const id = c.req.param("id")
  const body = await c.req.json()
  const { data } = await ctx.supabase
    .from("jobbings")
    .update(body)
    .eq("id", id)
    .select()
    .single()
  return c.json(data)
})

authed.delete("/jobbings/:id", async (c) => {
  const ctx = c.get("supabaseContext")
  const id = c.req.param("id")
  await ctx.supabase.from("jobbings").delete().eq("id", id)
  return c.newResponse(null, 204)
})

authed.get("/finances", async (c) => {
  const ctx = c.get("supabaseContext")
  const client =
    ctx.authMode === "secret" ? ctx.supabaseAdmin : ctx.supabase
  const { data } = await client
    .from("finance_records")
    .select("*")
    .order("date", { ascending: false })
  return c.json(data)
})

// --- Admin endpoints (superadmin only) ---

authed.get("/admin/profiles", async (c) => {
  const ctx = c.get("supabaseContext")
  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("role")
    .eq("user_id", ctx.userClaims?.id)
    .maybeSingle()
  if (profile?.role !== "superadmin") return c.json({ error: "Forbidden" }, 403)
  const { data } = await ctx.supabaseAdmin
    .from("profiles")
    .select("id, user_id, name, full_name, role, username, email")
  return c.json(data ?? [])
})

authed.post("/admin/create-user", async (c) => {
  const ctx = c.get("supabaseContext")
  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("role")
    .eq("user_id", ctx.userClaims?.id)
    .maybeSingle()
  if (profile?.role !== "superadmin") return c.json({ error: "Forbidden" }, 403)

  const { username, password, name, role: userRole } = await c.req.json()
  const email = `u_${username}@pos.local`
  const { data: newUser, error } = await ctx.supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: userRole ?? "admin", username },
  })
  if (error) return c.json({ error: error.message }, 400)

  const { error: profileError } = await ctx.supabaseAdmin
    .from("profiles")
    .update({ username, email, name, full_name: name })
    .eq("user_id", newUser.user.id)
  if (profileError) console.error("Failed to update profile username:", profileError)

  return c.json({ id: newUser.user.id, username }, 201)
})

authed.post("/admin/change-password", async (c) => {
  const ctx = c.get("supabaseContext")
  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("role")
    .eq("user_id", ctx.userClaims?.id)
    .maybeSingle()
  if (profile?.role !== "superadmin") return c.json({ error: "Forbidden" }, 403)

  const { userId, newPassword } = await c.req.json()
  const { error } = await ctx.supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  })
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ success: true })
})

// --- Public: resolve username to email (no auth needed) ---
app.post("/resolve-username", async (c) => {
  const { username } = await c.req.json()
  if (!username) return c.json({ error: "Username required" }, 400)

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SECRET_KEY") ?? ""
  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=email`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  )
  if (!res.ok) return c.json({ error: "Failed to resolve username" }, 500)
  const rows = await res.json()
  if (!rows || rows.length === 0) return c.json({ error: "User not found" }, 404)
  return c.json({ email: rows[0].email })
})

// Mount authed routes
app.route("/api", authed)

Deno.serve(app.fetch)
