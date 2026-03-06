import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isAppRole } from "@/lib/rbac"
import type { User } from "@supabase/supabase-js"

export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) return null
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null
  return authHeader.slice(7).trim() || null
}

export async function requireAdminOrSuperadmin(
  request: Request,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Supabase public credentials not configured" }, { status: 500 }),
    }
  }

  const token = getBearerToken(request)
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabaseUserClient.auth.getUser(token)
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const roleCandidate =
    (data.user.user_metadata?.role as string | undefined) ??
    (data.user.app_metadata?.role as string | undefined) ??
    (data.user.user_metadata?.user_role as string | undefined)
  const role = isAppRole(roleCandidate) ? roleCandidate : null

  if (role !== "admin" && role !== "superadmin") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { ok: true }
}

export async function requireSuperadmin(
  request: Request,
): Promise<{ ok: true; user: User } | { ok: false; response: NextResponse }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Supabase public credentials not configured" }, { status: 500 }),
    }
  }

  const token = getBearerToken(request)
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabaseUserClient.auth.getUser(token)
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const roleCandidate =
    (data.user.user_metadata?.role as string | undefined) ??
    (data.user.app_metadata?.role as string | undefined) ??
    (data.user.user_metadata?.user_role as string | undefined)
  const role = isAppRole(roleCandidate) ? roleCandidate : null

  if (role !== "superadmin") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { ok: true, user: data.user }
}
