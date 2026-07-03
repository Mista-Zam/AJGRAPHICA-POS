import { withSupabase } from "npm:@supabase/server"

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "600",
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  })
}

function getServiceKey(): string {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    ?? Deno.env.get("SUPABASE_SECRET_KEY")
    ?? ""
}

async function handleResolveUsername(req: Request): Promise<Response> {
  const body = await req.json()
  const username = body?.username
  if (!username) return json({ error: "Username required" }, 400)

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const key = getServiceKey()
  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=email`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  )
  if (!res.ok) return json({ error: "Failed lookup" }, 500)
  const rows = await res.json()
  if (!rows?.length) return json({ error: "User not found" }, 404)
  return json({ email: rows[0].email })
}

// Auth-protected handlers
const handlers: Record<string, (req: Request) => Promise<Response>> = {
  "POST /resolve-username": (req) => handleResolveUsername(req),

  "GET /services": withSupabase(
    { auth: "publishable" },
    async (_req: Request, ctx: any) => {
      const { data } = await ctx.supabase.from("services").select("*")
      return json(data)
    },
  ),

  "GET /jobbings": withSupabase(
    { auth: "user" },
    async (_req: Request, ctx: any) => {
      const { data } = await ctx.supabase.from("jobbings").select("*").order("created_at", { ascending: false })
      return json(data)
    },
  ),

  "POST /jobbings": withSupabase(
    { auth: "user" },
    async (req: Request, ctx: any) => {
      const body = await req.json()
      const { data } = await ctx.supabase.from("jobbings").insert(body).select().single()
      return json(data, 201)
    },
  ),

  "PUT /jobbings/:id": withSupabase(
    { auth: "user" },
    async (req: Request, ctx: any) => {
      const m = new URL(req.url).pathname.match(/\/jobbings\/([^/]+)/)
      if (!m) return json({ error: "Missing id" }, 400)
      const body = await req.json()
      const { data } = await ctx.supabase.from("jobbings").update(body).eq("id", m[1]).select().single()
      return json(data)
    },
  ),

  "DELETE /jobbings/:id": withSupabase(
    { auth: "user" },
    async (req: Request, ctx: any) => {
      const m = new URL(req.url).pathname.match(/\/jobbings\/([^/]+)/)
      if (!m) return json({ error: "Missing id" }, 400)
      await ctx.supabase.from("jobbings").delete().eq("id", m[1])
      return new Response(null, { status: 204, headers: corsHeaders() })
    },
  ),

  "GET /finances": withSupabase(
    { auth: ["user", "secret"] },
    async (_req: Request, ctx: any) => {
      const client = ctx.authMode === "secret" ? ctx.supabaseAdmin : ctx.supabase
      const { data } = await client.from("finance_records").select("*").order("date", { ascending: false })
      return json(data)
    },
  ),

  "GET /admin/profiles": withSupabase(
    { auth: "user" },
    async (_req: Request, ctx: any) => {
      const { data: p } = await ctx.supabase.from("profiles").select("role").eq("user_id", ctx.userClaims?.id).maybeSingle()
      if (p?.role !== "superadmin") return json({ error: "Forbidden" }, 403)
      const { data } = await ctx.supabaseAdmin.from("profiles").select("id, user_id, name, full_name, role, username, email")
      return json(data ?? [])
    },
  ),

  "POST /admin/create-user": withSupabase(
    { auth: "user" },
    async (req: Request, ctx: any) => {
      const { data: p } = await ctx.supabase.from("profiles").select("role").eq("user_id", ctx.userClaims?.id).maybeSingle()
      if (p?.role !== "superadmin") return json({ error: "Forbidden" }, 403)
      const { username, password, name, role: r } = await req.json()
      const email = `u_${username}@pos.local`
      const { data: u, error } = await ctx.supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { name, role: r ?? "admin", username },
      })
      if (error) return json({ error: error.message }, 400)
      await ctx.supabaseAdmin.from("profiles").update({ username, email, name, full_name: name }).eq("user_id", u.user.id)
      return json({ id: u.user.id, username }, 201)
    },
  ),

  "POST /admin/change-password": withSupabase(
    { auth: "user" },
    async (req: Request, ctx: any) => {
      const { data: p } = await ctx.supabase.from("profiles").select("role").eq("user_id", ctx.userClaims?.id).maybeSingle()
      if (p?.role !== "superadmin") return json({ error: "Forbidden" }, 403)
      const { userId, newPassword } = await req.json()
      const { error } = await ctx.supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
      if (error) return json({ error: error.message }, 400)
      return json({ success: true })
    },
  ),
}

Deno.serve((req: Request) => {
  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/server/, "") || "/"
  const method = req.method

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() })

  const exact = handlers[`${method} ${path}`]
  if (exact) return exact(req)

  if (method === "PUT" && /^\/jobbings\//.test(path)) return handlers["PUT /jobbings/:id"]?.(req) ?? json({ error: "Not Found" }, 404)
  if (method === "DELETE" && /^\/jobbings\//.test(path)) return handlers["DELETE /jobbings/:id"]?.(req) ?? json({ error: "Not Found" }, 404)

  return json({ error: "Not Found" }, 404)
})
