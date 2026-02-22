import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

/** Simulate one schedule read (what the calendar/hacker-view does) */
async function fetchScheduleOnce(client: ReturnType<typeof createClient>) {
  const [slotsRes, submissionsRes] = await Promise.all([
    client
      .from("calendar_schedule_slots")
      .select("id, date, start_time, end_time, room_id, submission_id")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true }),
    client.from("submissions").select("id, team_name, project_name"),
  ])
  return { slots: slotsRes.data, slotsError: slotsRes.error, submissions: submissionsRes.data, submissionsError: submissionsRes.error }
}

/** Insert one mock submission (for load testing write path) */
async function insertOneSubmission(
  client: ReturnType<typeof createClient>,
  index: number
): Promise<{ id?: string; error?: string }> {
  const row = {
    name: `LoadTest User ${index}`,
    team_name: `LoadTest Team ${index}`,
    members: [`Member ${index}`],
    devpost_link: `https://devpost.com/software/loadtest-${index}`,
    project_name: `LoadTest Project ${index}`,
    tracks: ["General"],
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- load-test route, schema not typed
  const { data, error } = await (client as any).from("submissions").insert(row).select("id").single()
  if (error) return { error: error.message }
  return { id: (data as { id: string } | null)?.id ?? undefined }
}

export type LoadTestResult = {
  action: string
  n: number
  durationMs: number
  successCount: number
  errorCount: number
  sampleErrors?: string[]
  insertedIds?: string[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action") ?? "schedule"
  const n = Math.min(1000, Math.max(1, parseInt(searchParams.get("n") ?? "10", 10)))
  const cleanup = searchParams.get("cleanup") === "1"

  const client = action === "submission" ? supabaseAdmin : supabase
  if (!client) {
    return NextResponse.json(
      { error: action === "submission" ? "Service role key required for submission test" : "Supabase not configured" },
      { status: 500 }
    )
  }

  const start = Date.now()
  const errors: string[] = []
  const insertedIds: string[] = []

  if (action === "schedule") {
    const results = await Promise.all(Array.from({ length: n }, () => fetchScheduleOnce(client as ReturnType<typeof createClient>)))
    let successCount = 0
    for (const r of results) {
      if (!r.slotsError && !r.submissionsError) successCount++
      else {
        if (r.slotsError) errors.push(r.slotsError.message)
        if (r.submissionsError) errors.push(r.submissionsError.message)
      }
    }
    const durationMs = Date.now() - start
    const result: LoadTestResult = {
      action: "schedule",
      n,
      durationMs,
      successCount,
      errorCount: n - successCount,
      sampleErrors: errors.slice(0, 5),
    }
    return NextResponse.json(result)
  }

  if (action === "submission") {
    const results = await Promise.all(
      Array.from({ length: n }, (_, i) => insertOneSubmission(client as ReturnType<typeof createClient>, i))
    )
    for (const r of results) {
      if (r.id) insertedIds.push(r.id)
      if (r.error) errors.push(r.error)
    }
    const successCount = insertedIds.length
    let durationMs = Date.now() - start

    if (cleanup && insertedIds.length > 0) {
      const deleteStart = Date.now()
      const batchSize = 50
      for (let i = 0; i < insertedIds.length; i += batchSize) {
        const chunk = insertedIds.slice(i, i + batchSize)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Supabase client in load-test
        await (client as any).from("submissions").delete().in("id", chunk)
      }
      durationMs += Date.now() - deleteStart
    }

    const result: LoadTestResult = {
      action: "submission",
      n,
      durationMs,
      successCount,
      errorCount: n - successCount,
      sampleErrors: errors.slice(0, 5),
      insertedIds: cleanup ? undefined : insertedIds.slice(0, 20),
    }
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: "Unknown action. Use action=schedule or action=submission" }, { status: 400 })
}
