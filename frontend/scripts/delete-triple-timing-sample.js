/**
 * Delete the triple-timing demo sample created by seed-triple-timing-sample.js.
 *
 * Usage:
 *   node scripts/delete-triple-timing-sample.js [judgeEmail]
 *
 * Example:
 *   node scripts/delete-triple-timing-sample.js
 *   node scripts/delete-triple-timing-sample.js sample.judge@hackcanada.test
 *
 * What this script removes:
 * - sample schedule slots
 * - sample judge assignments
 * - sample judge investments
 * - sample judge notes
 * - sample submission
 * - sample judge row
 * - sample judge auth user
 *
 * It intentionally keeps shared admin settings like hacker_schedule_visibility
 * and calendar_selected_date untouched.
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const SAMPLE = {
  judgeEmail: process.argv[2] || "sample.judge@hackcanada.test",
  devpostLink: "https://devpost.com/software/triple-timing-demo-project",
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

async function findJudgeRow(supabase, email) {
  const normalizedEmail = email.trim().toLowerCase()
  const { data, error } = await supabase
    .from("judges")
    .select("id")
    .ilike("email", normalizedEmail)
    .limit(1)

  if (error) throw error
  return data && data.length > 0 ? String(data[0].id) : null
}

async function findSubmissionRow(supabase, devpostLink) {
  const { data, error } = await supabase
    .from("submissions")
    .select("id")
    .eq("devpost_link", devpostLink)
    .limit(1)

  if (error) throw error
  return data && data.length > 0 ? String(data[0].id) : null
}

async function deleteJudgeAuthUser(supabase, email) {
  const normalizedEmail = email.trim().toLowerCase()
  const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listError) throw listError

  const existingUser = usersPage.users.find((user) => (user.email || "").toLowerCase() === normalizedEmail)
  if (!existingUser) return false

  const { error } = await supabase.auth.admin.deleteUser(existingUser.id)
  if (error) throw error
  return true
}

async function main() {
  const supabase = getClient()
  const judgeEmail = SAMPLE.judgeEmail.trim().toLowerCase()

  console.log("Deleting triple-timing demo sample...")

  const judgeId = await findJudgeRow(supabase, judgeEmail)
  const submissionId = await findSubmissionRow(supabase, SAMPLE.devpostLink)

  if (submissionId) {
    const { error: deleteSlotsError } = await supabase
      .from("calendar_schedule_slots")
      .delete()
      .eq("submission_id", submissionId)
    if (deleteSlotsError) throw deleteSlotsError

    const { error: deleteAssignmentsError } = await supabase
      .from("judge_project_assignments")
      .delete()
      .eq("submission_id", submissionId)
    if (deleteAssignmentsError) throw deleteAssignmentsError

    const { error: deleteInvestmentsError } = await supabase
      .from("judge_investments")
      .delete()
      .eq("submission_id", submissionId)
    if (deleteInvestmentsError) throw deleteInvestmentsError

    const { error: deleteNotesError } = await supabase
      .from("judge_notes")
      .delete()
      .eq("submission_id", submissionId)
    if (deleteNotesError) throw deleteNotesError

    const { error: deleteSubmissionError } = await supabase
      .from("submissions")
      .delete()
      .eq("id", submissionId)
    if (deleteSubmissionError) throw deleteSubmissionError

    console.log(`Deleted sample submission: ${submissionId}`)
  } else {
    console.log("No sample submission found.")
  }

  if (judgeId) {
    const { count, error: countError } = await supabase
      .from("judge_project_assignments")
      .select("*", { count: "exact", head: true })
      .eq("judge_id", judgeId)
    if (countError) throw countError

    const { error: updateJudgeError } = await supabase
      .from("judges")
      .update({
        assigned_projects: count || 0,
        total_invested: 0,
      })
      .eq("id", judgeId)
    if (updateJudgeError) throw updateJudgeError

    const { error: deleteJudgeInvestmentsError } = await supabase
      .from("judge_investments")
      .delete()
      .eq("judge_id", judgeId)
    if (deleteJudgeInvestmentsError) throw deleteJudgeInvestmentsError

    const { error: deleteJudgeNotesError } = await supabase
      .from("judge_notes")
      .delete()
      .eq("judge_id", judgeId)
    if (deleteJudgeNotesError) throw deleteJudgeNotesError

    const { error: deleteJudgeAssignmentsError } = await supabase
      .from("judge_project_assignments")
      .delete()
      .eq("judge_id", judgeId)
    if (deleteJudgeAssignmentsError) throw deleteJudgeAssignmentsError

    const { error: deleteJudgeRowError } = await supabase
      .from("judges")
      .delete()
      .eq("id", judgeId)
    if (deleteJudgeRowError) throw deleteJudgeRowError

    console.log(`Deleted sample judge row: ${judgeId}`)
  } else {
    console.log("No sample judge row found.")
  }

  const deletedAuthUser = await deleteJudgeAuthUser(supabase, judgeEmail)
  console.log(deletedAuthUser ? `Deleted sample auth user: ${judgeEmail}` : "No sample auth user found.")

  console.log("Done.")
}

main().catch((error) => {
  console.error("Delete failed:", error.message || error)
  process.exit(1)
})
