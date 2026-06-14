import { supabase } from "./supabase-client"
import { getUserRole } from "./rbac"

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signInJudgeWithPin(email: string, pin: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pin,
  })
  return { data, error }
}

export async function getCurrentUserWithRole() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) return { session: null, user: null, role: null }

  const role = getUserRole(session.user)
  return { session, user: session.user, role }
}
