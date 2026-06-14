/**
 * Seed one sample project with three judging timings.
 *
 * Usage:
 *   node scripts/seed-triple-timing-sample.js [judgeEmail] [judgePin] [date]
 *
 * Examples:
 *   node scripts/seed-triple-timing-sample.js
 *   node scripts/seed-triple-timing-sample.js sample.judge@hackcanada.test 123456 2026-02-14
 *
 * What this script does:
 * - creates/updates a judge auth user with role=judge
 * - creates/updates the matching row in public.judges
 * - creates/updates one sample submission
 * - enables public hacker schedule visibility
 * - assigns that submission to the judge
 * - creates exactly 3 schedule slots for the same project
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const SAMPLE = {
  judgeName: "Sample Judge",
  judgeEmail: process.argv[2] || "sample.judge@hackcanada.test",
  judgePin: process.argv[3] || "123456",
  date: process.argv[4] || "2026-03-08",
  teamName: "Triple Timing Test Team",
  projectName: "Triple Timing Demo Project",
  devpostLink: "https://devpost.com/software/triple-timing-demo-project",
  members: ["Casey Sample", "Jordan Example", "Taylor Demo"],
  tracks: ["General"],
  slots: [
    { start_time: "13:00:00", end_time: "13:05:00", room_id: 1 },
    { start_time: "14:00:00", end_time: "14:05:00", room_id: 2 },
    { start_time: "15:00:00", end_time: "15:05:00", room_id: 3 },
  ],
}

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

async function upsertJudgeAuthUser(supabase, email, name, pin) {
  const normalizedEmail = email.trim().toLowerCase()
  const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listError) throw listError

  const existingUser = usersPage.users.find((user) => (user.email || "").toLowerCase() === normalizedEmail)

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: pin,
      email_confirm: true,
      app_metadata: {
        ...(existingUser.app_metadata || {}),
        role: "judge",
      },
      user_metadata: {
        ...(existingUser.user_metadata || {}),
        role: "judge",
        name,
      },
    })
    if (error) throw error
    return data.user
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: pin,
    email_confirm: true,
    app_metadata: { role: "judge" },
    user_metadata: {
      role: "judge",
      name,
    },
  })
  if (error) throw error
  return data.user
}

async function upsertJudgeRow(supabase, email, name, tracks) {
  const normalizedEmail = email.trim().toLowerCase()
  const { data: existingRows, error: selectError } = await supabase
    .from("judges")
    .select("id, total_invested")
    .ilike("email", normalizedEmail)

  if (selectError) throw selectError

  if (existingRows && existingRows.length > 0) {
    const existing = existingRows[0]
    const { error: updateError } = await supabase
      .from("judges")
      .update({
        name,
        email: normalizedEmail,
        tracks,
      })
      .eq("id", existing.id)
    if (updateError) throw updateError
    return { id: String(existing.id), totalInvested: Number(existing.total_invested || 0) }
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("judges")
    .insert({
      name,
      email: normalizedEmail,
      tracks,
      assigned_projects: 0,
      total_invested: 0,
    })
    .select("id, total_invested")

  if (insertError) throw insertError
  return { id: String(insertedRows[0].id), totalInvested: Number(insertedRows[0].total_invested || 0) }
}

async function upsertSubmission(supabase, sample) {
  const { data: existingRows, error: selectError } = await supabase
    .from("submissions")
    .select("id")
    .eq("devpost_link", sample.devpostLink)
    .limit(1)

  if (selectError) throw selectError

  if (existingRows && existingRows.length > 0) {
    const existing = existingRows[0]
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        name: sample.members[0],
        team_name: sample.teamName,
        members: sample.members,
        project_name: sample.projectName,
        tracks: sample.tracks,
      })
      .eq("id", existing.id)
    if (updateError) throw updateError
    return String(existing.id)
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("submissions")
    .insert({
      name: sample.members[0],
      team_name: sample.teamName,
      members: sample.members,
      devpost_link: sample.devpostLink,
      project_name: sample.projectName,
      tracks: sample.tracks,
      submitted_at: new Date().toISOString(),
    })
    .select("id")

  if (insertError) throw insertError
  return String(insertedRows[0].id)
}

async function enablePublicSchedule(supabase) {
  const settings = [
    {
      setting_key: "hacker_schedule_visibility",
      setting_value: "enabled",
      updated_at: new Date().toISOString(),
    },
    {
      setting_key: "calendar_selected_date",
      setting_value: SAMPLE.date,
      updated_at: new Date().toISOString(),
    },
  ]
  const { error } = await supabase.from("admin_settings").upsert(settings, {
    onConflict: "setting_key",
  })
  if (error) throw error
}

async function syncAssignmentAndSchedule(supabase, judgeId, submissionId, date, slots) {
  const { error: assignmentError } = await supabase
    .from("judge_project_assignments")
    .upsert(
      {
        judge_id: judgeId,
        submission_id: submissionId,
      },
      { onConflict: "judge_id,submission_id" }
    )
  if (assignmentError) throw assignmentError

  const { error: deleteSlotsError } = await supabase
    .from("calendar_schedule_slots")
    .delete()
    .eq("submission_id", submissionId)
  if (deleteSlotsError) throw deleteSlotsError

  const slotRows = slots.map((slot) => ({
    date,
    start_time: slot.start_time,
    end_time: slot.end_time,
    room_id: slot.room_id,
    submission_id: submissionId,
    judge_ids: [judgeId],
    updated_at: new Date().toISOString(),
  }))

  const { error: insertSlotsError } = await supabase
    .from("calendar_schedule_slots")
    .insert(slotRows)
  if (insertSlotsError) throw insertSlotsError
}

async function syncAssignedProjectCount(supabase, judgeId) {
  const { count, error: countError } = await supabase
    .from("judge_project_assignments")
    .select("*", { count: "exact", head: true })
    .eq("judge_id", judgeId)

  if (countError) throw countError

  const { error: updateJudgeError } = await supabase
    .from("judges")
    .update({ assigned_projects: count || 0 })
    .eq("id", judgeId)

  if (updateJudgeError) throw updateJudgeError
}

async function main() {
  const supabase = getClient()
  const judgeEmail = SAMPLE.judgeEmail.trim().toLowerCase()

  console.log("Seeding triple-timing demo sample...")

  await upsertJudgeAuthUser(supabase, judgeEmail, SAMPLE.judgeName, SAMPLE.judgePin)
  console.log(`Prepared judge auth user: ${judgeEmail}`)

  const judge = await upsertJudgeRow(supabase, judgeEmail, SAMPLE.judgeName, SAMPLE.tracks)
  console.log(`Prepared judge row: ${judge.id}`)

  const submissionId = await upsertSubmission(supabase, SAMPLE)
  console.log(`Prepared sample submission: ${submissionId}`)

  await enablePublicSchedule(supabase)
  console.log(`Enabled public hacker schedule visibility and set calendar date to ${SAMPLE.date}`)

  await syncAssignmentAndSchedule(supabase, judge.id, submissionId, SAMPLE.date, SAMPLE.slots)
  await syncAssignedProjectCount(supabase, judge.id)

  console.log("")
  console.log("Done. Test with:")
  console.log(`- Judge login email: ${judgeEmail}`)
  console.log(`- Judge login PIN: ${SAMPLE.judgePin}`)
  console.log(`- Project: ${SAMPLE.projectName}`)
  console.log(`- Team: ${SAMPLE.teamName}`)
  console.log(`- Date: ${SAMPLE.date}`)
  console.log("- Slots:")
  SAMPLE.slots.forEach((slot, index) => {
    console.log(`  ${index + 1}. ${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)} (Room ${slot.room_id})`)
  })
  console.log("")
  console.log("You can verify it on:")
  console.log("- /schedule or /dashboard/hacker-view")
  console.log("- /dashboard/judges")
}

main().catch((error) => {
  console.error("Seed failed:", error.message || error)
  process.exit(1)
})
