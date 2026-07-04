import { supabase } from "./supabase"

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()
  return data ?? null
}

export async function restoreSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const profile = await getCurrentProfile()
  return profile ? { session, profile } : null
}

export const ADMIN_FUNCTION_URL = "https://pxaklzjiuncwgbzuqvis.supabase.co/functions/v1/server/admin"


