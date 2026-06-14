import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminOrSuperadmin } from "@/lib/api-auth"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

export async function GET(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Admin access not configured" }, { status: 500 })
  }

  const authResult = await requireAdminOrSuperadmin(request)
  if (!authResult.ok) return authResult.response

  const [judgesResult, submissionsResult, assignmentsResult, investmentsResult] =
    await Promise.all([
      supabaseAdmin.from("judges").select("id, name, assigned_projects, tracks"),
      supabaseAdmin.from("submissions").select("id, project_name, team_name, tracks, members, submitted_at"),
      supabaseAdmin.from("judge_project_assignments").select("judge_id, submission_id"),
      supabaseAdmin.from("judge_investments").select("judge_id, submission_id, amount"),
    ])

  if (judgesResult.error) {
    return NextResponse.json({ error: judgesResult.error.message }, { status: 500 })
  }
  if (submissionsResult.error) {
    return NextResponse.json({ error: submissionsResult.error.message }, { status: 500 })
  }
  if (assignmentsResult.error) {
    return NextResponse.json({ error: assignmentsResult.error.message }, { status: 500 })
  }
  if (investmentsResult.error) {
    return NextResponse.json({ error: investmentsResult.error.message }, { status: 500 })
  }

  return NextResponse.json({
    judges: judgesResult.data ?? [],
    submissions: submissionsResult.data ?? [],
    assignments: assignmentsResult.data ?? [],
    investments: investmentsResult.data ?? [],
    fetchedAt: new Date().toISOString(),
  })
}
