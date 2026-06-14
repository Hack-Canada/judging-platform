/**
 * Fix assignments:
 * - Remove MLH judges and MLH tracks from submissions
 * - Fix reactiv email typo (reactive@gmail.com → reactiv@gmail.com)
 * - Clear and recreate all judge_project_assignments
 *
 * Usage:
 *   node scripts/fix-assignments.js
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const MLH_JUDGE_EMAILS = ["mlh.judge.1@hackcanada.test", "mlh.judge.2@hackcanada.test"]
const MLH_TRACK_PREFIXES = ["[MLH]", "MLH x ElevenLabs"]

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

  // 1. Fix reactiv email typo
  console.log("1. Fixing reactiv email typo...")
  const { data: reactivJudge } = await supabase
    .from("judges")
    .select("id, email")
    .eq("email", "reactive@gmail.com")
    .maybeSingle()

  if (reactivJudge) {
    const { error } = await supabase
      .from("judges")
      .update({ email: "reactiv@gmail.com" })
      .eq("id", reactivJudge.id)
    if (error) throw error
    console.log("   Fixed: reactive@gmail.com → reactiv@gmail.com")
  } else {
    console.log("   No reactive@gmail.com found (already fixed or different email)")
  }

  // 2. Delete MLH judges and their assignments
  console.log("2. Removing MLH judges...")
  const { data: mlhJudges } = await supabase
    .from("judges")
    .select("id, email")
    .in("email", MLH_JUDGE_EMAILS)

  if (mlhJudges && mlhJudges.length > 0) {
    const mlhIds = mlhJudges.map((j) => j.id)
    const { error: delAssignErr } = await supabase
      .from("judge_project_assignments")
      .delete()
      .in("judge_id", mlhIds)
    if (delAssignErr) throw delAssignErr

    const { error: delJudgeErr } = await supabase
      .from("judges")
      .delete()
      .in("id", mlhIds)
    if (delJudgeErr) throw delJudgeErr
    console.log(`   Removed ${mlhJudges.length} MLH judge(s) and their assignments`)
  } else {
    console.log("   No MLH judges found")
  }

  // 3. Strip MLH tracks from all submissions
  console.log("3. Stripping MLH tracks from submissions...")
  const { data: allSubs } = await supabase
    .from("submissions")
    .select("id, tracks")

  let strippedCount = 0
  for (const sub of allSubs || []) {
    const tracks = Array.isArray(sub.tracks) ? sub.tracks : []
    const cleaned = tracks.filter(
      (t) => !MLH_TRACK_PREFIXES.some((prefix) => t.startsWith(prefix))
    )
    if (cleaned.length !== tracks.length) {
      const finalTracks = cleaned.length > 0 ? cleaned : ["General"]
      const { error } = await supabase
        .from("submissions")
        .update({ tracks: finalTracks })
        .eq("id", sub.id)
      if (error) throw error
      strippedCount++
    }
  }
  console.log(`   Updated ${strippedCount} submission(s)`)

  // 4. Clear all existing assignments and reset assigned_projects
  console.log("4. Clearing all existing assignments...")
  const { error: clearErr } = await supabase
    .from("judge_project_assignments")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000") // delete all
  if (clearErr) throw clearErr

  const { error: resetErr } = await supabase
    .from("judges")
    .update({ assigned_projects: 0 })
    .neq("id", "00000000-0000-0000-0000-000000000000")
  if (resetErr) throw resetErr
  console.log("   Done")

  // 5. Load updated judges and submissions, rebuild assignments
  console.log("5. Rebuilding assignments...")
  const { data: judges } = await supabase
    .from("judges")
    .select("id, name, email, tracks")
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, project_name, tracks")

  if (!judges?.length || !submissions?.length) {
    console.log("   No judges or submissions — nothing to assign")
    return
  }

  const generalJudges = judges.filter((j) => j.tracks.includes("General"))
  const specialistJudges = judges.filter((j) => !j.tracks.includes("General"))
  const assignmentCount = new Map(judges.map((j) => [j.id, 0]))

  function sortByLoad(candidates) {
    return [...candidates].sort((a, b) => {
      const diff = (assignmentCount.get(a.id) || 0) - (assignmentCount.get(b.id) || 0)
      if (diff !== 0) return diff
      return a.email.localeCompare(b.email)
    })
  }

  const rows = []
  const existingSet = new Set()

  for (const sub of submissions) {
    const tracks = Array.isArray(sub.tracks) && sub.tracks.length > 0 ? sub.tracks : ["General"]
    const picks = []

    // Specialists whose track overlaps
    for (const judge of specialistJudges) {
      if (judge.tracks.some((t) => tracks.includes(t)) && !picks.some((p) => p.id === judge.id)) {
        picks.push(judge)
      }
    }

    // Fill up to 2 general judges (3 if specialist assigned)
    const targetCount = picks.length > 0 ? 3 : 2
    for (const judge of sortByLoad(generalJudges)) {
      if (picks.length >= targetCount) break
      if (!picks.some((p) => p.id === judge.id)) picks.push(judge)
    }

    // Fallback: ensure at least 2
    if (picks.length < 2) {
      for (const judge of sortByLoad(judges)) {
        if (picks.length >= 2) break
        if (!picks.some((p) => p.id === judge.id)) picks.push(judge)
      }
    }

    for (const judge of picks) {
      const key = `${judge.id}:${sub.id}`
      if (!existingSet.has(key)) {
        rows.push({ judge_id: judge.id, submission_id: sub.id })
        existingSet.add(key)
        assignmentCount.set(judge.id, (assignmentCount.get(judge.id) || 0) + 1)
      }
    }
  }

  // Insert in batches
  const BATCH = 200
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from("judge_project_assignments").insert(rows.slice(i, i + BATCH))
    if (error) throw error
  }

  // Update assigned_projects counts
  for (const judge of judges) {
    const count = assignmentCount.get(judge.id) || 0
    await supabase.from("judges").update({ assigned_projects: count }).eq("id", judge.id)
  }

  console.log(`   Inserted ${rows.length} assignments\n`)
  console.log("Summary:")
  for (const judge of judges) {
    const count = assignmentCount.get(judge.id) || 0
    console.log(`  ${judge.name} (${judge.tracks.join(", ")}): ${count} assignments`)
  }
  console.log("\nDone!")
}

main().catch((err) => {
  console.error("Error:", err.message || err)
  process.exit(1)
})
