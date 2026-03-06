/**
 * Seed an event scenario with ~100 projects, 11 judges, and sponsor-specific assignment rules.
 *
 * Usage:
 *   node scripts/seed-event-scenario.js [totalProjects] [date]
 *
 * Example:
 *   node scripts/seed-event-scenario.js
 *   node scripts/seed-event-scenario.js 100 2026-03-08
 *
 * What this script does:
 * - upserts admin settings for tracks, rooms, and judging hours
 * - creates 11 judge auth users and matching public.judges rows
 * - inserts ~100 submissions for a realistic event mix
 * - assigns 2 or 3 judges per project into judge_project_assignments
 * - creates 2 or 3 calendar_schedule_slots per project
 * - MLH judge only gets MLH Prize projects
 * - sponsor judges only get their own sponsor track projects
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const TOTAL_PROJECTS = Math.max(1, parseInt(process.argv[2] || "100", 10))
const EVENT_DATE = process.argv[3] || "2026-03-08"
const DEVPOST_PREFIX = "https://devpost.com/software/event-scenario-project-"
const DEFAULT_PIN_PREFIX = "20"

const TRACKS = [
  { id: 1, name: "General", description: "General category for all projects" },
  { id: 2, name: "RBC Track", description: "RBC sponsor-specific track" },
  { id: 3, name: "Uber Track", description: "Uber sponsor-specific track" },
  { id: 4, name: "Solo Hack", description: "Solo hackathon category" },
  { id: 5, name: "Beginners Hack", description: "For first-time hackers" },
  { id: 6, name: "MLH Prize", description: "Projects eligible for MLH prize judging" },
]

const ROOMS = Array.from({ length: 11 }, (_, index) => ({
  id: index + 1,
  name: `Room ${index + 1}`,
  description: `Judging room ${index + 1}`,
}))

const JUDGES = [
  { name: "Avery Brooks", email: "judge1.general@hackcanada.test", tracks: ["General"] },
  { name: "Jordan Patel", email: "judge2.general@hackcanada.test", tracks: ["General"] },
  { name: "Casey Nguyen", email: "judge3.general@hackcanada.test", tracks: ["General"] },
  { name: "Taylor Wong", email: "judge4.general@hackcanada.test", tracks: ["General"] },
  { name: "Morgan Diaz", email: "judge5.general@hackcanada.test", tracks: ["General"] },
  { name: "Riley Shah", email: "judge6.general@hackcanada.test", tracks: ["General"] },
  { name: "Parker Kim", email: "judge7.general@hackcanada.test", tracks: ["General", "Beginners Hack"] },
  { name: "Sam Rivera", email: "judge8.general@hackcanada.test", tracks: ["General", "Solo Hack"] },
  { name: "Robin Chen", email: "judge9.rbc@hackcanada.test", tracks: ["RBC Track"] },
  { name: "Quinn Lopez", email: "judge10.uber@hackcanada.test", tracks: ["Uber Track"] },
  { name: "Drew Foster", email: "judge11.mlh@hackcanada.test", tracks: ["MLH Prize"] },
]

const GENERAL_JUDGE_EMAILS = new Set(JUDGES.filter((judge) => judge.tracks.includes("General")).map((judge) => judge.email))
const SPECIALIST_TRACKS = new Set(["RBC Track", "Uber Track", "MLH Prize"])
const ROOM_POOLS = {
  general: [1, 2, 3, 4, 5, 6],
  beginners: [7],
  solo: [8],
  rbc: [9],
  uber: [10],
  mlh: [11],
}

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

  if (plan.length < totalProjects) {
    while (plan.length < totalProjects) {
      plan.push(["General"])
    }
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

async function upsertSettings(supabase) {
  const settings = [
    { setting_key: "tracks_data", setting_value: JSON.stringify(TRACKS) },
    { setting_key: "rooms_data", setting_value: JSON.stringify(ROOMS) },
    { setting_key: "calendar_start_time", setting_value: "10:00" },
    { setting_key: "calendar_end_time", setting_value: "17:00" },
    { setting_key: "calendar_slot_duration", setting_value: "5" },
    { setting_key: "calendar_selected_date", setting_value: EVENT_DATE },
    { setting_key: "calendar_judges_per_project", setting_value: "2" },
    { setting_key: "hacker_schedule_visibility", setting_value: "enabled" },
  ].map((setting) => ({
    ...setting,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from("admin_settings")
    .upsert(settings, { onConflict: "setting_key" })

  if (error) throw error
}

async function upsertJudgeAuthUser(supabase, judge, pin) {
  const normalizedEmail = judge.email.toLowerCase()
  const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listError) throw listError

  const existingUser = usersPage.users.find((user) => (user.email || "").toLowerCase() === normalizedEmail)

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: pin,
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
    return
  }

  const { error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: pin,
    email_confirm: true,
    app_metadata: { role: "judge" },
    user_metadata: {
      role: "judge",
      name: judge.name,
    },
  })
  if (error) throw error
}

async function upsertJudges(supabase) {
  const inserted = []

  for (let index = 0; index < JUDGES.length; index += 1) {
    const judge = JUDGES[index]
    const pin = `${DEFAULT_PIN_PREFIX}${String(index + 1).padStart(2, "0")}`
    await upsertJudgeAuthUser(supabase, judge, pin)

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
          total_invested: 0,
        })
        .eq("id", existing.id)
      if (updateError) throw updateError

      inserted.push({
        id: String(existing.id),
        name: judge.name,
        email: normalizedEmail,
        tracks: judge.tracks,
        pin,
      })
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

      inserted.push({
        id: String(insertRows[0].id),
        name: judge.name,
        email: normalizedEmail,
        tracks: judge.tracks,
        pin,
      })
    }
  }

  return inserted
}

async function clearExistingScenario(supabase, judgeIds) {
  const { data: existingScenarioSubs, error: selectSubsError } = await supabase
    .from("submissions")
    .select("id")
    .like("devpost_link", `${DEVPOST_PREFIX}%`)

  if (selectSubsError) throw selectSubsError

  const submissionIds = (existingScenarioSubs || []).map((row) => String(row.id))

  if (submissionIds.length > 0) {
    const deleteOps = [
      supabase.from("calendar_schedule_slots").delete().in("submission_id", submissionIds),
      supabase.from("judge_project_assignments").delete().in("submission_id", submissionIds),
      supabase.from("judge_investments").delete().in("submission_id", submissionIds),
      supabase.from("judge_notes").delete().in("submission_id", submissionIds),
      supabase.from("submissions").delete().in("id", submissionIds),
    ]

    const results = await Promise.all(deleteOps)
    results.forEach((result) => {
      if (result.error) throw result.error
    })
  }

  if (judgeIds.length > 0) {
    const { error: clearAssignmentsError } = await supabase
      .from("judge_project_assignments")
      .delete()
      .in("judge_id", judgeIds)
    if (clearAssignmentsError) throw clearAssignmentsError

    const { error: clearInvestmentsError } = await supabase
      .from("judge_investments")
      .delete()
      .in("judge_id", judgeIds)
    if (clearInvestmentsError) throw clearInvestmentsError

    const { error: clearNotesError } = await supabase
      .from("judge_notes")
      .delete()
      .in("judge_id", judgeIds)
    if (clearNotesError) throw clearNotesError
  }
}

async function insertSubmissions(supabase, totalProjects) {
  const trackPlan = buildTrackPlan(totalProjects)
  const rows = trackPlan.map((tracks, index) => generateSubmission(index, tracks))
  const { data, error } = await supabase
    .from("submissions")
    .insert(rows)
    .select("id, project_name, team_name, tracks")

  if (error) throw error
  return (data || []).map((row) => ({
    id: String(row.id),
    projectName: row.project_name,
    teamName: row.team_name,
    tracks: Array.isArray(row.tracks) && row.tracks.length > 0 ? row.tracks : ["General"],
  }))
}

function buildJudgePools(judges) {
  const byEmail = new Map(judges.map((judge) => [judge.email, judge]))

  return {
    general: judges.filter((judge) => GENERAL_JUDGE_EMAILS.has(judge.email)),
    beginners: judges.filter((judge) => judge.tracks.includes("Beginners Hack")),
    solo: judges.filter((judge) => judge.tracks.includes("Solo Hack")),
    rbc: byEmail.get("judge9.rbc@hackcanada.test"),
    uber: byEmail.get("judge10.uber@hackcanada.test"),
    mlh: byEmail.get("judge11.mlh@hackcanada.test"),
  }
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
}

function assignJudgesToSubmissions(submissions, judges) {
  const pools = buildJudgePools(judges)
  const assignmentCount = new Map(judges.map((judge) => [judge.id, 0]))
  const rows = []
  const assignmentBySubmission = new Map()

  function sortByLoad(candidates) {
    return [...candidates].sort((a, b) => {
      const diff = (assignmentCount.get(a.id) || 0) - (assignmentCount.get(b.id) || 0)
      if (diff !== 0) return diff
      return a.email.localeCompare(b.email)
    })
  }

  function addJudge(picks, judge) {
    if (!judge || picks.some((picked) => picked.id === judge.id)) return
    picks.push(judge)
  }

  for (const submission of submissions) {
    const picks = []
    const tracks = submission.tracks
    const sponsorTrack = tracks.find((track) => SPECIALIST_TRACKS.has(track))

    if (sponsorTrack === "MLH Prize") {
      addJudge(picks, pools.mlh)
    } else if (sponsorTrack === "RBC Track") {
      addJudge(picks, pools.rbc)
    } else if (sponsorTrack === "Uber Track") {
      addJudge(picks, pools.uber)
    }

    if (tracks.includes("Beginners Hack")) {
      addJudge(picks, sortByLoad(pools.beginners)[0])
    }

    if (tracks.includes("Solo Hack")) {
      addJudge(picks, sortByLoad(pools.solo)[0])
    }

    const targetJudgeCount = sponsorTrack ? 3 : 2
    for (const judge of sortByLoad(pools.general)) {
      if (picks.length >= targetJudgeCount) break
      addJudge(picks, judge)
    }

    if (picks.length < 2) {
      for (const judge of sortByLoad(judges)) {
        if (picks.length >= 2) break
        addJudge(picks, judge)
      }
    }

    for (const judge of picks) {
      rows.push({
        judge_id: judge.id,
        submission_id: submission.id,
      })
      assignmentCount.set(judge.id, (assignmentCount.get(judge.id) || 0) + 1)
    }

    assignmentBySubmission.set(submission.id, picks.map((judge) => judge.id))
  }

  return {
    rows,
    assignmentCount,
    assignmentBySubmission,
  }
}

function getTrackRoomPool(track) {
  if (track === "MLH Prize") return ROOM_POOLS.mlh
  if (track === "RBC Track") return ROOM_POOLS.rbc
  if (track === "Uber Track") return ROOM_POOLS.uber
  if (track === "Beginners Hack") return ROOM_POOLS.beginners
  if (track === "Solo Hack") return ROOM_POOLS.solo
  return ROOM_POOLS.general
}

function buildCalendarSessions(submissions, assignmentBySubmission, judges) {
  const judgesById = new Map(judges.map((judge) => [judge.id, judge]))
  const sessions = []

  for (const submission of submissions) {
    const assignedJudgeIds = assignmentBySubmission.get(submission.id) || []
    const assignedJudges = assignedJudgeIds
      .map((judgeId) => judgesById.get(judgeId))
      .filter(Boolean)

    const usedJudgeIds = new Set()
    const specialTracks = submission.tracks.filter((track) => track !== "General")

    for (const track of specialTracks) {
      const specialist = assignedJudges.find(
        (judge) => !usedJudgeIds.has(judge.id) && judge.tracks.includes(track)
      )
      if (!specialist) continue

      sessions.push({
        submissionId: submission.id,
        judgeIds: [specialist.id],
        roomPool: getTrackRoomPool(track),
        label: track,
      })
      usedJudgeIds.add(specialist.id)
    }

    const remainingJudges = assignedJudges.filter((judge) => !usedJudgeIds.has(judge.id))
    for (const judge of remainingJudges) {
      sessions.push({
        submissionId: submission.id,
        judgeIds: [judge.id],
        roomPool: ROOM_POOLS.general,
        label: "General",
      })
    }
  }

  return sessions
}

function scheduleSessions(sessions, date) {
  const scheduledSlots = []
  const roomBusyAt = new Set()
  const judgeBusyAt = new Set()
  const submissionLastStart = new Map()
  const dayStart = timeToMinutes("10:00")
  const dayEnd = timeToMinutes("17:00")
  const slotDuration = 5

  const orderedSessions = [...sessions].sort((a, b) => {
    if (a.label === b.label) return a.submissionId.localeCompare(b.submissionId)
    if (a.label === "General") return -1
    if (b.label === "General") return 1
    return a.label.localeCompare(b.label)
  })

  for (const session of orderedSessions) {
    let placed = false
    const preferredEarliest = submissionLastStart.has(session.submissionId)
      ? submissionLastStart.get(session.submissionId) + slotDuration
      : dayStart

    for (let start = preferredEarliest; start + slotDuration <= dayEnd; start += slotDuration) {
      const judgeConflict = session.judgeIds.some((judgeId) => judgeBusyAt.has(`${judgeId}:${start}`))
      if (judgeConflict) continue

      for (const roomId of session.roomPool) {
        const roomKey = `${roomId}:${start}`
        if (roomBusyAt.has(roomKey)) continue

        roomBusyAt.add(roomKey)
        session.judgeIds.forEach((judgeId) => judgeBusyAt.add(`${judgeId}:${start}`))
        submissionLastStart.set(session.submissionId, start)
        scheduledSlots.push({
          date,
          start_time: minutesToTime(start),
          end_time: minutesToTime(start + slotDuration),
          submission_id: session.submissionId,
          room_id: roomId,
          judge_ids: session.judgeIds,
        })
        placed = true
        break
      }

      if (placed) break
    }

    if (!placed) {
      throw new Error(`Could not place schedule session for submission ${session.submissionId}`)
    }
  }

  return scheduledSlots
}

async function saveAssignments(supabase, assignmentRows, judges, assignmentCount) {
  if (assignmentRows.length > 0) {
    const { error } = await supabase
      .from("judge_project_assignments")
      .upsert(assignmentRows, { onConflict: "judge_id,submission_id" })
    if (error) throw error
  }

  for (const judge of judges) {
    const { error } = await supabase
      .from("judges")
      .update({
        assigned_projects: assignmentCount.get(judge.id) || 0,
        total_invested: 0,
      })
      .eq("id", judge.id)
    if (error) throw error
  }
}

async function saveCalendarSlots(supabase, scheduledSlots) {
  if (scheduledSlots.length === 0) return

  const { error } = await supabase
    .from("calendar_schedule_slots")
    .insert(
      scheduledSlots.map((slot) => ({
        ...slot,
        updated_at: new Date().toISOString(),
      }))
    )

  if (error) throw error
}

async function main() {
  const supabase = getClient()

  console.log(`Seeding event scenario with ${TOTAL_PROJECTS} projects for ${EVENT_DATE}...`)

  await upsertSettings(supabase)
  console.log("Updated admin settings for tracks, rooms, and judging hours.")

  const judges = await upsertJudges(supabase)
  console.log(`Prepared ${judges.length} judges and auth users.`)

  await clearExistingScenario(supabase, judges.map((judge) => judge.id))
  console.log("Cleared previous event scenario rows.")

  const submissions = await insertSubmissions(supabase, TOTAL_PROJECTS)
  console.log(`Inserted ${submissions.length} scenario submissions.`)

  const { rows: assignmentRows, assignmentCount, assignmentBySubmission } = assignJudgesToSubmissions(submissions, judges)
  await saveAssignments(supabase, assignmentRows, judges, assignmentCount)

  const sessions = buildCalendarSessions(submissions, assignmentBySubmission, judges)
  const scheduledSlots = scheduleSessions(sessions, EVENT_DATE)
  await saveCalendarSlots(supabase, scheduledSlots)

  const assignmentValues = Array.from(assignmentCount.values())
  const minAssignments = Math.min(...assignmentValues)
  const maxAssignments = Math.max(...assignmentValues)
  const mlhProjects = submissions.filter((submission) => submission.tracks.includes("MLH Prize")).length
  const rbcProjects = submissions.filter((submission) => submission.tracks.includes("RBC Track")).length
  const uberProjects = submissions.filter((submission) => submission.tracks.includes("Uber Track")).length
  const timingsPerSubmission = new Map()
  scheduledSlots.forEach((slot) => {
    timingsPerSubmission.set(slot.submission_id, (timingsPerSubmission.get(slot.submission_id) || 0) + 1)
  })
  const minTimings = Math.min(...Array.from(timingsPerSubmission.values()))
  const maxTimings = Math.max(...Array.from(timingsPerSubmission.values()))

  console.log("")
  console.log("Done.")
  console.log(`- Judges prepared: ${judges.length}`)
  console.log(`- Submissions inserted: ${submissions.length}`)
  console.log(`- Judge assignments inserted: ${assignmentRows.length}`)
  console.log(`- Calendar slots inserted: ${scheduledSlots.length}`)
  console.log(`- Assignment load range: min=${minAssignments}, max=${maxAssignments}`)
  console.log(`- Timings per project: min=${minTimings}, max=${maxTimings}`)
  console.log(`- MLH projects: ${mlhProjects}`)
  console.log(`- RBC projects: ${rbcProjects}`)
  console.log(`- Uber projects: ${uberProjects}`)
  console.log("")
  console.log("Judge logins:")
  judges.forEach((judge) => {
    console.log(`- ${judge.name}: ${judge.email} / ${judge.pin} (${judge.tracks.join(", ")})`)
  })
}

main().catch((error) => {
  console.error("Seed failed:", error.message || error)
  process.exit(1)
})
