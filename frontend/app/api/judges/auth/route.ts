import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isAppRole } from "@/lib/rbac"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) return null
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null
  return authHeader.slice(7).trim() || null
}

async function requireAdminOrSuperadmin(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Supabase public credentials not configured" }, { status: 500 }),
    }
  }

  const token = getBearerToken(request)
  if (!token) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabaseUserClient.auth.getUser(token)
  if (error || !data.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const roleCandidate =
    (data.user.user_metadata?.role as string | undefined) ??
    (data.user.app_metadata?.role as string | undefined) ??
    (data.user.user_metadata?.user_role as string | undefined)
  const role = isAppRole(roleCandidate) ? roleCandidate : null

  if (role !== "admin" && role !== "superadmin") {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { ok: true as const }
}

type JudgeAuthPayload = {
  email?: string
  name?: string
  pin?: string
}

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Admin access not configured" }, { status: 500 })
  }

  const authResult = await requireAdminOrSuperadmin(request)
  if (!authResult.ok) return authResult.response

  try {
    const body = (await request.json()) as JudgeAuthPayload
    const email = body.email?.trim().toLowerCase()
    const name = body.name?.trim() || null
    const pin = body.pin?.trim() || ""

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    if (!pin || pin.length < 4) {
      return NextResponse.json({ error: "PIN must be at least 4 characters" }, { status: 400 })
    }

    const { data: usersPage, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const existingUser = usersPage.users.find((u) => (u.email ?? "").toLowerCase() === email)
    if (existingUser) {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: pin,
        app_metadata: {
          ...(existingUser.app_metadata ?? {}),
          role: "judge",
        },
        user_metadata: {
          ...(existingUser.user_metadata ?? {}),
          role: "judge",
          ...(name ? { name } : {}),
        },
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, userId: data.user.id })
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
      app_metadata: { role: "judge" },
      user_metadata: {
        role: "judge",
        ...(name ? { name } : {}),
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: data.user.id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
