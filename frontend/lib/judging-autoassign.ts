import type { AdminProject } from "@/lib/admin-projects-data"
import type { Judge } from "@/lib/judges-data"

export type AutoAssignResult = {
  updatedProjects: AdminProject[]
  judgeAssignedCountByName: Map<string, number>
  underAssignedProjects: Array<{
    projectName: string
    assigned: number
    minimumRequired: number
    eligibleJudges: number
  }>
}

export type ScheduleSlot = {
  date: string
  start_time: string
  end_time: string
  submission_id: string
  room_id: number
  judge_ids: string[]
}

/** judgeId (string UUID) → roomId (number) */
export type JudgeRoomMap = Map<string, number>

// ---------------------------------------------------------------------------
// Auto-assign: deterministic track → judge matching
// ---------------------------------------------------------------------------

/**
 * For each project, assigns every judge whose track appears in the project's
 * track list. One judge can own multiple tracks; they are only assigned once
 * per project (deduped by judge name).
 *
 * Projects with no matching judge end up in underAssignedProjects.
 */
export const autoAssignByTrackMatch = (
  judges: Judge[],
  projects: AdminProject[],
): AutoAssignResult => {
  // Build track → Judge[] lookup (all judges sharing a track)
  const trackToJudges = new Map<string, Judge[]>()
  judges.forEach((judge) => {
    judge.tracks?.forEach((track) => {
      if (!trackToJudges.has(track)) trackToJudges.set(track, [])
      trackToJudges.get(track)!.push(judge)
    })
  })

  // Round-robin cursor per track so assignments are spread evenly
  const trackRoundRobin = new Map<string, number>()
  trackToJudges.forEach((_, track) => trackRoundRobin.set(track, 0))

  const judgeAssignmentCount = new Map<string, number>()
  judges.forEach((judge) => judgeAssignmentCount.set(judge.name, 0))

  const underAssignedProjects: AutoAssignResult["underAssignedProjects"] = []

  const updatedProjects = projects.map((project) => {
    const projectTracks: string[] =
      Array.isArray(project.tracks) && project.tracks.length > 0
        ? (project.tracks as string[])
        : []

    const assignedJudges: string[] = []

    for (const track of projectTracks) {
      const judgesForTrack = trackToJudges.get(track)
      if (!judgesForTrack || judgesForTrack.length === 0) continue

      // Round-robin: pick next judge in rotation for this track
      const cursor = trackRoundRobin.get(track) ?? 0
      const judge = judgesForTrack[cursor % judgesForTrack.length]
      trackRoundRobin.set(track, cursor + 1)

      if (!assignedJudges.includes(judge.name)) {
        assignedJudges.push(judge.name)
        judgeAssignmentCount.set(
          judge.name,
          (judgeAssignmentCount.get(judge.name) ?? 0) + 1,
        )
      }
    }

    if (assignedJudges.length === 0) {
      underAssignedProjects.push({
        projectName: project.name,
        assigned: 0,
        minimumRequired: 1,
        eligibleJudges: 0,
      })
    }

    return { ...project, assignedJudges }
  })

  return {
    updatedProjects,
    judgeAssignedCountByName: judgeAssignmentCount,
    underAssignedProjects,
  }
}

// ---------------------------------------------------------------------------
// Schedule builder: one slot per (project, judge) pair, judge in fixed room
// ---------------------------------------------------------------------------

type ScheduleSubmission = {
  submissionId: string
  judgeIds: string[]
}

type BuildSchedulePerJudgeRoomInput = {
  submissions: ScheduleSubmission[]
  judgeRoomMap: JudgeRoomMap
  scheduleDate: string
  startTime: string
  endTime: string
  slotDurationMinutes: number
}

type BuildScheduleResult = {
  slots: ScheduleSlot[]
  unscheduledSubmissionIds: string[]
  roomMoveCount: number
}

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

/**
 * Builds a schedule where each judge has a fixed room and teams rotate between
 * rooms. Each (submission, judge) pair gets its own time slot.
 *
 * Constraint: a team cannot appear in two rooms at the same time tick.
 *
 * Returns slots with exactly one judge_id per slot.
 */
export const buildSchedulePerJudgeRoom = (
  input: BuildSchedulePerJudgeRoomInput,
): BuildScheduleResult => {
  const {
    submissions,
    judgeRoomMap,
    scheduleDate,
    startTime,
    endTime,
    slotDurationMinutes,
  } = input

  // Build per-judge queue: judgeId → submissionId[]
  // Preserve insertion order for consistent scheduling
  const judgeQueue = new Map<string, string[]>()
  for (const sub of submissions) {
    for (const judgeId of sub.judgeIds) {
      if (!judgeQueue.has(judgeId)) judgeQueue.set(judgeId, [])
      judgeQueue.get(judgeId)!.push(sub.submissionId)
    }
  }

  const slots: ScheduleSlot[] = []
  let currentTick = timeToMinutes(startTime)
  const scheduleEnd = timeToMinutes(endTime)

  while (currentTick + slotDurationMinutes <= scheduleEnd) {
    // Track which submission teams are already placed this tick
    const teamsThisTick = new Set<string>()
    let anyPlaced = false

    for (const [judgeId, queue] of judgeQueue) {
      if (queue.length === 0) continue

      const roomId = judgeRoomMap.get(judgeId)
      if (roomId === undefined) continue

      // Find the first project in this judge's queue not already scheduled this tick
      const idx = queue.findIndex((submId) => !teamsThisTick.has(submId))
      if (idx === -1) continue

      const submId = queue.splice(idx, 1)[0]
      teamsThisTick.add(submId)
      anyPlaced = true

      slots.push({
        date: scheduleDate,
        start_time: minutesToTime(currentTick),
        end_time: minutesToTime(currentTick + slotDurationMinutes),
        submission_id: submId,
        room_id: roomId,
        judge_ids: [judgeId],
      })
    }

    // If nothing was placed this tick (all queues empty or all blocked), stop
    if (!anyPlaced) break

    currentTick += slotDurationMinutes
  }

  // Any submissions still remaining in queues are unscheduled
  const remainingSet = new Set<string>()
  for (const queue of judgeQueue.values()) {
    queue.forEach((submId) => remainingSet.add(submId))
  }

  return {
    slots,
    unscheduledSubmissionIds: Array.from(remainingSet),
    roomMoveCount: 0, // not applicable in the fixed-room model
  }
}

// ---------------------------------------------------------------------------
// @deprecated — kept for reference only, no longer used
// ---------------------------------------------------------------------------

/** @deprecated Use autoAssignByTrackMatch instead */
export const autoAssignProjectsByTrack = (
  _judges: Judge[],
  _projects: AdminProject[],
  _requestedJudgesPerProject: number,
): AutoAssignResult => {
  throw new Error(
    "autoAssignProjectsByTrack is deprecated. Use autoAssignByTrackMatch.",
  )
}

/** @deprecated Use buildSchedulePerJudgeRoom instead */
export const buildScheduleWithMinimalRoomMoves = (): never => {
  throw new Error(
    "buildScheduleWithMinimalRoomMoves is deprecated. Use buildSchedulePerJudgeRoom.",
  )
}

/** @deprecated No longer needed */
export const clampJudgesPerProject = (value: number): number => value
