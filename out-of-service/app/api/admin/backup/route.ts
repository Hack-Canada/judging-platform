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

  const { searchParams } = new URL(request.url)
  const snapshotId = searchParams.get("id")

  if (snapshotId) {
    // Return full snapshot (including JSONB data) for download
    const { data, error } = await supabaseAdmin
      .from("db_backups")
      .select("*")
      .eq("id", snapshotId)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Snapshot not found" }, { status: 404 })

    return NextResponse.json(data)
  }

  // List mode: return metadata only (no heavy JSONB payloads), most recent 50
  const { data, error } = await supabaseAdmin
    .from("db_backups")
    .select("id, snapshot_at, triggered_by, row_counts, error_info")
    .order("snapshot_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ snapshots: data })
}
