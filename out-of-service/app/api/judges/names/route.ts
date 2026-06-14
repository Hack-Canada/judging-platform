import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from("judges")
    .select("id, name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const map: Record<string, string> = {}
  data?.forEach((j: { id: string; name: string }) => {
    map[j.id] = j.name
  })

  return NextResponse.json(map)
}
