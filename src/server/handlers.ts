/* eslint-disable @typescript-eslint/no-explicit-any */
import { withSupabase } from "@supabase/server"
import type { Database } from "../lib/database.types"

const db = (client: unknown) => client as any

export const listServices = withSupabase<Database>(
  { auth: "publishable" },
  async (_req, ctx) => {
    const { data, error } = await ctx.supabase.from("services").select("*")
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json(data)
  },
)

export const getJobbings = withSupabase<Database>(
  { auth: "user" },
  async (_req, ctx) => {
    const { data, error } = await ctx.supabase
      .from("jobbings")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json(data)
  },
)

export const createJobbing = withSupabase<Database>(
  { auth: "user" },
  async (req, ctx) => {
    const body = await req.json()
    const { data, error } = await db(ctx.supabase)
      .from("jobbings")
      .insert(body)
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json(data, { status: 201 })
  },
)

export const updateJobbing = withSupabase<Database>(
  { auth: "user" },
  async (req, ctx) => {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

    const body = await req.json()
    const { data, error } = await db(ctx.supabase)
      .from("jobbings")
      .update(body)
      .eq("id", id)
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json(data)
  },
)

export const deleteJobbing = withSupabase<Database>(
  { auth: "user" },
  async (req, ctx) => {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

    const { error } = await db(ctx.supabase)
      .from("jobbings")
      .delete()
      .eq("id", id)
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return new Response(null, { status: 204 })
  },
)

export const getFinances = withSupabase<Database>(
  { auth: ["user", "secret"] },
  async (_req, ctx) => {
    const client =
      ctx.authMode === "secret" ? ctx.supabaseAdmin : ctx.supabase
    const { data, error } = await client
      .from("finance_records")
      .select("*")
      .order("date", { ascending: false })
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json(data)
  },
)

export const getSettings = withSupabase<Database>(
  { auth: "secret" },
  async (_req, ctx) => {
    const { data, error } = await ctx.supabaseAdmin
      .from("settings")
      .select("*")
      .single()
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json(data)
  },
)

export const health = withSupabase(
  { auth: "none" },
  async () => Response.json({ status: "ok" }),
)
