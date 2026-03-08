import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminOrSuperadmin } from "@/lib/api-auth"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
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

type JudgeAuthPayload = {
  email?: string
  name?: string
  pin?: string
}

function isValidJudgePin(pin: string): boolean {
  return /^\d{6}$/.test(pin)
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
    if (!isValidJudgePin(pin)) {
      return NextResponse.json({ error: "PIN must be exactly 6 digits" }, { status: 400 })
    }

    const { data: usersPage, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const existingUser = usersPage.users.find((u) => (u.email ?? "").toLowerCase() === email)
    if (existingUser) {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        // Supabase Auth stores judge credentials in the password field, but the app
        // treats this strictly as a 6-digit PIN for /judge-login.
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
      // Supabase Auth uses the password field under the hood; for judges this value
      // is always an admin-issued 6-digit PIN rather than a general password.
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
