/**
 * Populate judge_project_assignments for existing judges and submissions.
 *
 * Reads judges and submissions already in the DB, then assigns judges to
 * submissions whose tracks overlap. Skips assignments that already exist.
 *
 * Usage:
 *   node scripts/seed-assignments.js
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    process.exit(1)
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function main() {
  const supabase = getClient()

  // Fetch all judges
  const { data: judges, error: judgesError } = await supabase
    .from("judges")
    .select("id, name, email, tracks")

  if (judgesError) throw judgesError
  if (!judges || judges.length === 0) {
    console.log("No judges found. Add judges first.")
    return
  }
  console.log(`Found ${judges.length} judges`)

  // Fetch all submissions
  const { data: submissions, error: subsError } = await supabase
    .from("submissions")
    .select("id, project_name, tracks")

  if (subsError) throw subsError
  if (!submissions || submissions.length === 0) {
    console.log("No submissions found. Add submissions first.")
    return
  }
  console.log(`Found ${submissions.length} submissions`)

  // Fetch existing assignments to avoid duplicates
  const { data: existingAssignments, error: existingError } = await supabase
    .from("judge_project_assignments")
    .select("judge_id, submission_id")

  if (existingError) throw existingError

  const existingSet = new Set(
    (existingAssignments || []).map((a) => `${a.judge_id}:${a.submission_id}`)
  )
  console.log(`Found ${existingSet.size} existing assignments`)

  // Build judge pools by track
  // Judges with "General" track are general judges
  // Judges with only a specific track are specialists for that track
  const generalJudges = judges.filter((j) => j.tracks.includes("General"))
  const specialistJudges = judges.filter((j) => !j.tracks.includes("General"))

  // Track assignment counts for load balancing
  const assignmentCount = new Map(judges.map((j) => [j.id, 0]))

  function sortByLoad(candidates) {
    return [...candidates].sort((a, b) => {
      const diff = (assignmentCount.get(a.id) || 0) - (assignmentCount.get(b.id) || 0)
      if (diff !== 0) return diff
      return a.email.localeCompare(b.email)
    })
  }

  const rows = []

  for (const submission of submissions) {
    const tracks = Array.isArray(submission.tracks) && submission.tracks.length > 0
      ? submission.tracks
      : ["General"]

    const picks = []

    // Assign specialists whose track matches any of the submission's tracks
    for (const judge of specialistJudges) {
      const hasOverlap = judge.tracks.some((t) => tracks.includes(t))
      if (hasOverlap && !picks.some((p) => p.id === judge.id)) {
        picks.push(judge)
      }
    }

    // Fill up to 2 general judges (or 3 if there's a specialist)
    const targetCount = picks.length > 0 ? 3 : 2
    for (const judge of sortByLoad(generalJudges)) {
      if (picks.length >= targetCount) break
      if (!picks.some((p) => p.id === judge.id)) {
        picks.push(judge)
      }
    }

    // Fallback: ensure at least 2 judges
    if (picks.length < 2) {
      for (const judge of sortByLoad(judges)) {
        if (picks.length >= 2) break
        if (!picks.some((p) => p.id === judge.id)) {
          picks.push(judge)
        }
      }
    }

    for (const judge of picks) {
      const key = `${judge.id}:${submission.id}`
      if (!existingSet.has(key)) {
        rows.push({ judge_id: judge.id, submission_id: submission.id })
        existingSet.add(key)
        assignmentCount.set(judge.id, (assignmentCount.get(judge.id) || 0) + 1)
      }
    }
  }

  if (rows.length === 0) {
    console.log("No new assignments to insert — all already exist.")
    return
  }

  console.log(`Inserting ${rows.length} new assignments...`)

  // Insert in batches of 200
  const BATCH = 200
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase.from("judge_project_assignments").insert(batch)
    if (error) throw error
    console.log(`  Inserted batch ${Math.floor(i / BATCH) + 1} (${batch.length} rows)`)
  }

  // Update assigned_projects count on each judge
  for (const judge of judges) {
    const count = assignmentCount.get(judge.id) || 0
    if (count > 0) {
      const { error } = await supabase
        .from("judges")
        .update({ assigned_projects: (judge.assigned_projects || 0) + count })
        .eq("id", judge.id)
      if (error) console.warn(`  Warning: could not update assigned_projects for ${judge.email}:`, error.message)
    }
  }

  console.log("Done!")
  console.log("\nAssignment summary:")
  for (const judge of judges) {
    const count = assignmentCount.get(judge.id) || 0
    if (count > 0) console.log(`  ${judge.name} (${judge.tracks.join(", ")}): ${count} new assignments`)
  }
}

main().catch((err) => {
  console.error("Error:", err.message || err)
  process.exit(1)
})
