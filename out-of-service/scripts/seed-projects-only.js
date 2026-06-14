/**
 * Seed project submissions only.
 *
 * Usage:
 *   node scripts/seed-projects-only.js [totalProjects]
 *
 * Examples:
 *   node scripts/seed-projects-only.js
 *   node scripts/seed-projects-only.js 100
 *
 * What this script does:
 * - inserts submissions into public.submissions
 *
 * What this script does not do:
 * - create judges
 * - create assignments
 * - create schedule slots
 * - update admin settings
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const TOTAL_PROJECTS = Math.max(1, parseInt(process.argv[2] || "100", 10))
const DEVPOST_PREFIX = "https://devpost.com/software/projects-only-seed-"

const TRACK_BUCKETS = [
  { tracks: ["General"], count: 40 },
  { tracks: ["Beginners Hack"], count: 14 },
  { tracks: ["Solo Hack"], count: 12 },
  { tracks: ["RBC Track"], count: 10 },
  { tracks: ["Uber Track"], count: 10 },
  { tracks: ["MLH Prize"], count: 8 },
  { tracks: ["General", "Beginners Hack"], count: 3 },
  { tracks: ["General", "Solo Hack"], count: 1 },
  { tracks: ["General", "RBC Track"], count: 1 },
  { tracks: ["General", "Uber Track"], count: 1 },
]

const TEAM_WORDS = [
  "Quantum", "Pixel", "Vector", "Syntax", "Byte", "Lambda", "Prism", "Nexus", "Atlas", "Orbit",
  "Nova", "Cipher", "Pulse", "Echo", "Forge", "Zenith", "Apex", "Spark", "Flux", "Helix",
]

const PROJECT_WORDS = [
  "Smart", "Cloud", "Quick", "Safe", "Bright", "Flow", "Stack", "Mesh", "Core", "Edge",
  "Signal", "Bridge", "Scope", "Pilot", "Beacon", "Vision", "Guide", "Launch", "Sprint", "Wave",
]

const FIRST_NAMES = [
  "Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Reese",
  "Jamie", "Dakota", "Skyler", "Parker", "Charlie", "Finley", "Hayden", "Rowan", "Emerson", "Cameron",
]

const LAST_NAMES = [
  "Nguyen", "Patel", "Smith", "Khan", "Lee", "Brown", "Wong", "Garcia", "Davis", "Lopez",
  "Kim", "Shah", "Chen", "Foster", "Brooks", "Diaz", "Rivera", "Singh", "Taylor", "Wilson",
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

function buildTrackPlan(totalProjects) {
  const plan = []

  for (const bucket of TRACK_BUCKETS) {
    for (let i = 0; i < bucket.count; i += 1) {
      plan.push(bucket.tracks)
    }
  }

  while (plan.length < totalProjects) {
    plan.push(["General"])
  }

  return plan.slice(0, totalProjects)
}

function generateSubmission(index, tracks) {
  const first = pick(FIRST_NAMES, index)
  const second = pick(FIRST_NAMES, index + 7)
  const third = pick(FIRST_NAMES, index + 13)
  const members = [
    `${first} ${pick(LAST_NAMES, index)}`,
    `${second} ${pick(LAST_NAMES, index + 5)}`,
    `${third} ${pick(LAST_NAMES, index + 11)}`,
  ]

  return {
    name: members[0],
    team_name: `Team ${pick(TEAM_WORDS, index)} ${index + 1}`,
    members,
    devpost_link: `${DEVPOST_PREFIX}${index + 1}`,
    project_name: `${pick(PROJECT_WORDS, index)} ${pick(PROJECT_WORDS, index + 9)} ${index + 1}`,
    tracks,
    submitted_at: new Date().toISOString(),
  }
}

async function upsertSubmission(supabase, submission) {
  const { data: existingRows, error: selectError } = await supabase
    .from("submissions")
    .select("id")
    .eq("devpost_link", submission.devpost_link)
    .limit(1)

  if (selectError) throw selectError

  if (existingRows && existingRows.length > 0) {
    const existing = existingRows[0]
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        name: submission.name,
        team_name: submission.team_name,
        members: submission.members,
        project_name: submission.project_name,
        tracks: submission.tracks,
      })
      .eq("id", existing.id)

    if (updateError) throw updateError
    return "updated"
  }

  const { error: insertError } = await supabase.from("submissions").insert(submission)
  if (insertError) throw insertError
  return "inserted"
}

async function main() {
  const supabase = getClient()
  const trackPlan = buildTrackPlan(TOTAL_PROJECTS)

  let inserted = 0
  let updated = 0

  console.log(`Seeding ${TOTAL_PROJECTS} project submission(s) only...`)

  for (let index = 0; index < TOTAL_PROJECTS; index += 1) {
    const result = await upsertSubmission(supabase, generateSubmission(index, trackPlan[index]))
    if (result === "inserted") inserted += 1
    if (result === "updated") updated += 1
  }

  console.log(`Inserted: ${inserted}`)
  console.log(`Updated: ${updated}`)
  console.log("Done.")
}

main().catch((error) => {
  console.error("Projects-only seed failed:", error.message || error)
  process.exit(1)
})
