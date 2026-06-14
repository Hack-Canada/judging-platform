/**
 * Seed additional judges only.
 *
 * Usage:
 *   node scripts/seed-judges-only.js [additionalJudges]
 *
 * Examples:
 *   node scripts/seed-judges-only.js
 *   node scripts/seed-judges-only.js 4
 *
 * What this script does:
 * - creates additional auth users with role=judge
 * - creates matching rows in public.judges
 *
 * What this script does not do:
 * - create submissions
 * - create assignments
 * - create schedule slots
 * - update admin settings
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const ADDITIONAL_JUDGES = Math.max(1, parseInt(process.argv[2] || "4", 10))

const FIRST_NAMES = [
  "Avery",
  "Jordan",
  "Casey",
  "Taylor",
  "Morgan",
  "Riley",
  "Parker",
  "Sam",
  "Quinn",
  "Drew",
  "Alex",
  "Jamie",
]

const LAST_NAMES = [
  "Brooks",
  "Patel",
  "Nguyen",
  "Wong",
  "Diaz",
  "Shah",
  "Kim",
  "Rivera",
  "Lopez",
  "Foster",
  "Chen",
  "Singh",
]

const TRACK_ROTATION = [
  ["General"],
  ["General"],
  ["General", "Beginners Hack"],
  ["General", "Solo Hack"],
  ["RBC Track"],
  ["Uber Track"],
]

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    process.exit(1)
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function pick(arr, index) {
  return arr[index % arr.length]
}

function buildJudgeSeed(index) {
  const humanIndex = index + 1
  const first = pick(FIRST_NAMES, index)
  const last = pick(LAST_NAMES, index + 3)
  const name = `${first} ${last}`

  return {
    name,
    email: `extra.judge.${humanIndex}@hackcanada.test`,
    pin: `3${String(humanIndex).padStart(5, "0")}`,
    tracks: TRACK_ROTATION[index % TRACK_ROTATION.length],
  }
}

async function listAuthUsers(supabase) {
  let page = 1
  const users = []

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const batch = data.users || []
    users.push(...batch)

    if (batch.length < 1000) break
    page += 1
  }

  return users
}

async function upsertJudgeAuthUser(supabase, existingUsers, judge) {
  const normalizedEmail = judge.email.toLowerCase()
  const existingUser = existingUsers.find((user) => (user.email || "").toLowerCase() === normalizedEmail)

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: judge.pin,
      email_confirm: true,
      app_metadata: {
        ...(existingUser.app_metadata || {}),
        role: "judge",
      },
      user_metadata: {
        ...(existingUser.user_metadata || {}),
        role: "judge",
        name: judge.name,
      },
    })
    if (error) throw error
    return "updated"
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: judge.pin,
    email_confirm: true,
    app_metadata: { role: "judge" },
    user_metadata: {
      role: "judge",
      name: judge.name,
    },
  })
  if (error) throw error
  existingUsers.push(data.user)
  return "inserted"
}

async function upsertJudgeRow(supabase, judge) {
  const normalizedEmail = judge.email.toLowerCase()
  const { data: existingRows, error: selectError } = await supabase
    .from("judges")
    .select("id")
    .ilike("email", normalizedEmail)

  if (selectError) throw selectError

  if (existingRows && existingRows.length > 0) {
    const existing = existingRows[0]
    const { error: updateError } = await supabase
      .from("judges")
      .update({
        name: judge.name,
        email: normalizedEmail,
        tracks: judge.tracks,
      })
      .eq("id", existing.id)
    if (updateError) throw updateError
    return "updated"
  }

  const { error: insertError } = await supabase.from("judges").insert({
    name: judge.name,
    email: normalizedEmail,
    tracks: judge.tracks,
    assigned_projects: 0,
    total_invested: 0,
  })
  if (insertError) throw insertError
  return "inserted"
}

async function main() {
  const supabase = getClient()
  const existingUsers = await listAuthUsers(supabase)

  console.log(`Creating ${ADDITIONAL_JUDGES} additional judge(s)...`)

  let authInserted = 0
  let authUpdated = 0
  let rowInserted = 0
  let rowUpdated = 0

  for (let index = 0; index < ADDITIONAL_JUDGES; index += 1) {
    const judge = buildJudgeSeed(index)
    const authResult = await upsertJudgeAuthUser(supabase, existingUsers, judge)
    const rowResult = await upsertJudgeRow(supabase, judge)

    if (authResult === "inserted") authInserted += 1
    if (authResult === "updated") authUpdated += 1
    if (rowResult === "inserted") rowInserted += 1
    if (rowResult === "updated") rowUpdated += 1

    console.log(
      `- ${judge.name} <${judge.email}> pin=${judge.pin} tracks=${judge.tracks.join(", ")}`
    )
  }

  console.log(`Auth users inserted: ${authInserted}`)
  console.log(`Auth users updated: ${authUpdated}`)
  console.log(`Judge rows inserted: ${rowInserted}`)
  console.log(`Judge rows updated: ${rowUpdated}`)
  console.log("Done.")
}

main().catch((error) => {
  console.error("Judges-only seed failed:", error.message || error)
  process.exit(1)
})
