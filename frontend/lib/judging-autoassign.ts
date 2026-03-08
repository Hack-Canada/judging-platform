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
// Auto-assign: room-aware — all judges in the same room share the same projects
// ---------------------------------------------------------------------------

/**
 * Room-aware auto-assign. Judges are grouped by their room assignment.
 * The greedy round-robin operates on rooms instead of individual judges,
 * so every judge in a room receives the same set of projects.
 * Each judge still ranks/scores independently.
 *
 * Fallback: projects with no matching track judge fall back to rooms that
 * cover "General", round-robin across those rooms.
 *
 * @param judges          - All judges with their tracks
 * @param projects        - All projects to assign
 * @param judgeRoomMap    - judgeId (as string) → roomId
 */
export const autoAssignByRoomAndTrack = (
  judges: Judge[],
  projects: AdminProject[],
  judgeRoomMap: JudgeRoomMap,
): AutoAssignResult => {
  // Build roomId → Judge[] from the room map
  const roomToJudges = new Map<number, Judge[]>()
  judges.forEach((judge) => {
    const roomId = judgeRoomMap.get(String(judge.id))
    if (roomId === undefined) return
    if (!roomToJudges.has(roomId)) roomToJudges.set(roomId, [])
    roomToJudges.get(roomId)!.push(judge)
  })

  // Build track → roomId[] lookup: which rooms cover each track
  // A room covers a track if at least one judge in that room has that track
  const trackToRooms = new Map<string, number[]>()
  roomToJudges.forEach((roomJudges, roomId) => {
    const tracksInRoom = new Set<string>()
    roomJudges.forEach((judge) => {
      judge.tracks?.forEach((track) => tracksInRoom.add(track))
    })
    tracksInRoom.forEach((track) => {
      if (!trackToRooms.has(track)) trackToRooms.set(track, [])
      trackToRooms.get(track)!.push(roomId)
    })
  })

  // Round-robin cursor per track (across rooms)
  const trackRoundRobin = new Map<string, number>()
  trackToRooms.forEach((_, track) => trackRoundRobin.set(track, 0))

  // Rooms that cover "General" — used as fallback
  const generalRooms = trackToRooms.get("General") ?? []
  let generalRoomCursor = 0

  const judgeAssignmentCount = new Map<string, number>()
  judges.forEach((judge) => judgeAssignmentCount.set(judge.name, 0))

  const underAssignedProjects: AutoAssignResult["underAssignedProjects"] = []

  const updatedProjects = projects.map((project) => {
    const projectTracks: string[] =
      Array.isArray(project.tracks) && project.tracks.length > 0
        ? (project.tracks as string[])
        : []

    // Collect the set of rooms to assign for this project
    const assignedRoomIds = new Set<number>()

    for (const track of projectTracks) {
      const rooms = trackToRooms.get(track)
      if (!rooms || rooms.length === 0) continue

      // Round-robin: pick the next room in rotation for this track
      const cursor = trackRoundRobin.get(track) ?? 0
      const roomId = rooms[cursor % rooms.length]
      trackRoundRobin.set(track, cursor + 1)
      assignedRoomIds.add(roomId)
    }

    // Fallback to General rooms if no room matched
    if (assignedRoomIds.size === 0 && generalRooms.length > 0) {
      const roomId = generalRooms[generalRoomCursor % generalRooms.length]
      generalRoomCursor++
      assignedRoomIds.add(roomId)
    }

    // Expand rooms → all judges in those rooms
    const assignedJudges: string[] = []
    assignedRoomIds.forEach((roomId) => {
      const roomJudges = roomToJudges.get(roomId) ?? []
      roomJudges.forEach((judge) => {
        if (!assignedJudges.includes(judge.name)) {
          assignedJudges.push(judge.name)
          judgeAssignmentCount.set(
            judge.name,
            (judgeAssignmentCount.get(judge.name) ?? 0) + 1,
          )
        }
      })
    })

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
