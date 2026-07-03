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

app.use(
  withSupabase({
    auth: ["user", "publishable", "secret"],
  }),
)

app.get("/health", (c) => c.json({ status: "ok" }))

app.get("/services", async (c) => {
  const ctx = c.get("supabaseContext")
  const { data } = await ctx.supabase.from("services").select("*")
  return c.json(data)
})

app.get("/jobbings", async (c) => {
  const ctx = c.get("supabaseContext")
  const { data } = await ctx.supabase
    .from("jobbings")
    .select("*")
    .order("created_at", { ascending: false })
  return c.json(data)
})

app.post("/jobbings", async (c) => {
  const ctx = c.get("supabaseContext")
  const body = await c.req.json()
  const { data } = await ctx.supabase
    .from("jobbings")
    .insert(body)
    .select()
    .single()
  return c.json(data, 201)
})

app.put("/jobbings/:id", async (c) => {
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

app.delete("/jobbings/:id", async (c) => {
  const ctx = c.get("supabaseContext")
  const id = c.req.param("id")
  await ctx.supabase.from("jobbings").delete().eq("id", id)
  return c.newResponse(null, 204)
})

app.get("/finances", async (c) => {
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

app.get("/admin/profiles", async (c) => {
  const ctx = c.get("supabaseContext")
  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("role")
    .eq("user_id", ctx.userClaims?.id)
    .maybeSingle()
  if (profile?.role !== "superadmin") return c.json({ error: "Forbidden" }, 403)
  const { data } = await ctx.supabaseAdmin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
  return c.json(data ?? [])
})

app.post("/admin/create-user", async (c) => {
  const ctx = c.get("supabaseContext")
  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("role")
    .eq("user_id", ctx.userClaims?.id)
    .maybeSingle()
  if (profile?.role !== "superadmin") return c.json({ error: "Forbidden" }, 403)

  const { email, password, name, role: userRole } = await c.req.json()
  const { data: newUser, error } = await ctx.supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: userRole ?? "admin" },
  })
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ id: newUser.user.id, email: newUser.user.email }, 201)
})

app.post("/admin/change-password", async (c) => {
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

Deno.serve(app.fetch)
