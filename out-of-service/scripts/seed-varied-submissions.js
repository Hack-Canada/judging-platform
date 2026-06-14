/**
 * Seed varied-track submissions and evenly distribute assignments across judges.
 *
 * Usage (from frontend):
 *   node scripts/seed-varied-submissions.js [totalSubmissions] [judgesPerSubmission]
 *
 * Example:
 *   node scripts/seed-varied-submissions.js 72 2
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const TRACK_COMBINATIONS = [
  ["General"],
  ["Beginners Hack"],
  ["RBC Track"],
  ["Uber Track"],
  ["Solo Hack"],
  ["General", "Beginners Hack"],
  ["General", "RBC Track"],
  ["General", "Uber Track"],
  ["General", "Solo Hack"],
  ["RBC Track", "Uber Track"],
  ["Beginners Hack", "Solo Hack"],
  ["RBC Track", "Solo Hack"],
]

const JUDGE_SEED_LIST = [
  { name: "Marcus Chen", email: "marcus.chen@hackcanada.com", tracks: ["General"] },
  { name: "Priya Sharma", email: "priya.sharma@hackcanada.com", tracks: ["General"] },
  { name: "aslkmsdklcmm", email: "a@a.a", tracks: ["General", "Beginners Hack", "RBC Track", "Uber Track", "Solo Hack"] },
  { name: "Riley Patel", email: "riley.patel@hackcanada.test", tracks: ["General", "Uber Track"] },
  { name: "Morgan Lee", email: "morgan.lee@hackcanada.test", tracks: ["General"] },
  { name: "Sam Rivera", email: "sam.rivera@hackcanada.test", tracks: ["General", "RBC Track", "Uber Track"] },
  { name: "Marcus Chen", email: "marcus.chen@hackcanada.test", tracks: ["General", "Uber Track"] },
  { name: "Alex Kim", email: "alex.kim@hackcanada.test", tracks: ["Beginners Hack", "General"] },
  { name: "Jordan Taylor", email: "jordan.taylor@hackcanada.test", tracks: ["General"] },
  { name: "Priya Sharma", email: "priya.sharma@hackcanada.test", tracks: ["General", "RBC Track"] },
  { name: "Casey Wong", email: "casey.wong@hackcanada.test", tracks: ["Solo Hack", "General"] },
]

const FIRST_NAMES = [
  "Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Avery",
  "Quinn", "Reese", "Jamie", "Dakota", "Skyler", "Parker", "Charlie", "Finley",
]
const LAST_NAMES = [
  "Nguyen", "Patel", "Smith", "Khan", "Lee", "Brown", "Wong", "Garcia", "Davis", "Lopez",
]
const TEAM_WORDS = ["Quantum", "Pixel", "Vector", "Syntax", "Byte", "Lambda", "Prism", "Nexus", "Atlas", "Orbit"]
const PROJECT_WORDS = ["Smart", "Cloud", "Quick", "Safe", "Bright", "Flow", "Stack", "Mesh", "Core", "Edge"]

function pick(arr, idx) {
  return arr[idx % arr.length]
}

function generateSubmission(i) {
  const tracks = TRACK_COMBINATIONS[i % TRACK_COMBINATIONS.length]
  const first = pick(FIRST_NAMES, i)
  const second = pick(FIRST_NAMES, i + 3)
  const third = pick(FIRST_NAMES, i + 7)
  const members = [
    `${first} ${pick(LAST_NAMES, i)}`,
    `${second} ${pick(LAST_NAMES, i + 2)}`,
    `${third} ${pick(LAST_NAMES, i + 4)}`,
  ]

  return {
    name: members[0],
    team_name: `Team ${pick(TEAM_WORDS, i)} ${i + 1}`,
    members,
    devpost_link: `https://devpost.com/software/varied-seed-project-${i + 1}`,
    project_name: `${pick(PROJECT_WORDS, i)} ${pick(PROJECT_WORDS, i + 5)} ${i + 1}`,
    tracks,
    submitted_at: new Date().toISOString(),
  }
}

function isEligible(judgeTracks, submissionTracks) {
  const sponsorTracks = submissionTracks.filter((t) => t !== "General")
  if (sponsorTracks.length === 0) return true
  return sponsorTracks.some((track) => judgeTracks.includes(track))
}

async function upsertJudges(supabase) {
  const judges = []
  for (const judge of JUDGE_SEED_LIST) {
    const normalizedEmail = judge.email.toLowerCase()
    const { data: existingRows, error: selectError } = await supabase
      .from("judges")
      .select("id, assigned_projects")
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
      judges.push({ id: String(existing.id), email: normalizedEmail, name: judge.name, tracks: judge.tracks })
    } else {
      const { data: insertRows, error: insertError } = await supabase
        .from("judges")
        .insert({
          name: judge.name,
          email: normalizedEmail,
          tracks: judge.tracks,
          assigned_projects: 0,
          total_invested: 0,
        })
        .select("id")
      if (insertError) throw insertError
      judges.push({ id: String(insertRows[0].id), email: normalizedEmail, name: judge.name, tracks: judge.tracks })
    }
  }
  return judges
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key in .env.local")
    process.exit(1)
  }

  const totalSubmissions = Math.max(1, parseInt(process.argv[2] || "72", 10))
  const judgesPerSubmission = Math.max(1, parseInt(process.argv[3] || "2", 10))
  const supabase = createClient(url, key)

  console.log(`Seeding ${totalSubmissions} varied-track submissions with ${judgesPerSubmission} judge(s) each...`)
  const judges = await upsertJudges(supabase)
  console.log(`Upserted ${judges.length} judges.`)

  const submissionRows = Array.from({ length: totalSubmissions }, (_, i) => generateSubmission(i))
  const { data: insertedSubs, error: insertSubsError } = await supabase
    .from("submissions")
    .insert(submissionRows)
    .select("id, tracks")
  if (insertSubsError) throw insertSubsError

  const judgeIds = judges.map((j) => j.id)
  const { data: existingAssignments, error: existingAssignmentsError } = await supabase
    .from("judge_project_assignments")
    .select("judge_id")
    .in("judge_id", judgeIds)
  if (existingAssignmentsError) throw existingAssignmentsError

  const assignedCount = new Map()
  for (const judge of judges) assignedCount.set(judge.id, 0)
  ;(existingAssignments || []).forEach((row) => {
    const id = String(row.judge_id)
    assignedCount.set(id, (assignedCount.get(id) || 0) + 1)
  })

  const assignmentRows = []
  for (const sub of insertedSubs || []) {
    const tracks = Array.isArray(sub.tracks) && sub.tracks.length > 0 ? sub.tracks : ["General"]
    let eligible = judges.filter((judge) => isEligible(judge.tracks, tracks))
    if (eligible.length === 0) {
      eligible = judges
    }

    eligible.sort((a, b) => {
      const diff = (assignedCount.get(a.id) || 0) - (assignedCount.get(b.id) || 0)
      if (diff !== 0) return diff
      return a.email.localeCompare(b.email)
    })

    const picks = eligible.slice(0, Math.min(judgesPerSubmission, eligible.length))
    for (const judge of picks) {
      assignmentRows.push({
        judge_id: judge.id,
        submission_id: String(sub.id),
      })
      assignedCount.set(judge.id, (assignedCount.get(judge.id) || 0) + 1)
    }
  }

  const { error: upsertAssignmentError } = await supabase
    .from("judge_project_assignments")
    .upsert(assignmentRows, { onConflict: "judge_id,submission_id" })
  if (upsertAssignmentError) throw upsertAssignmentError

  for (const judge of judges) {
    const { error: updateJudgeError } = await supabase
      .from("judges")
      .update({ assigned_projects: assignedCount.get(judge.id) || 0 })
      .eq("id", judge.id)
    if (updateJudgeError) throw updateJudgeError
  }

  const minAssignments = Math.min(...judges.map((j) => assignedCount.get(j.id) || 0))
  const maxAssignments = Math.max(...judges.map((j) => assignedCount.get(j.id) || 0))
  console.log(`Inserted submissions: ${(insertedSubs || []).length}`)
  console.log(`Upserted judge assignments: ${assignmentRows.length}`)
  console.log(`Distribution range (assigned_projects): min=${minAssignments}, max=${maxAssignments}`)
  console.log("Done.")
}

main().catch((error) => {
  console.error("Seed failed:", error.message || error)
  process.exit(1)
})
