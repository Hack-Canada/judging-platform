import type { AdminProject } from "@/lib/admin-projects-data"
import type { Judge } from "@/lib/judges-data"
import type { Room } from "@/lib/rooms-data"

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

const MIN_JUDGES_PER_PROJECT = 2
const MIN_REQUIRED_JUDGES_PER_PROJECT = 1
const MAX_JUDGES_PER_PROJECT = 3

export const clampJudgesPerProject = (value: number): number => {
  return Math.min(MAX_JUDGES_PER_PROJECT, Math.max(MIN_JUDGES_PER_PROJECT, value))
}

const getProjectTracks = (project: AdminProject): string[] => {
  const rawTracks = project.tracks
  if (Array.isArray(rawTracks) && rawTracks.length > 0) {
    return rawTracks as string[]
  }
  return ["General"]
}

const canJudgeSubmission = (judge: Judge, projectTracks: string[]): boolean => {
  const sponsorTracks = projectTracks.filter((track) => track !== "General")
  if (sponsorTracks.length === 0) {
    return true
  }
  // any overlap with sponsor tracks is enough.
  return sponsorTracks.some((track) => judge.tracks?.includes(track))
}

export const autoAssignProjectsByTrack = (
  judges: Judge[],
  projects: AdminProject[],
  requestedJudgesPerProject: number,
): AutoAssignResult => {
  const targetJudgesPerProject = clampJudgesPerProject(requestedJudgesPerProject)

  const updatedProjects = projects.map((project) => ({
    ...project,
    assignedJudges: [] as string[],
  }))

  const judgeAssignmentCount = new Map<string, number>()
  judges.forEach((judge) => {
    judgeAssignmentCount.set(judge.name, 0)
  })

  const underAssignedProjects: AutoAssignResult["underAssignedProjects"] = []

  projects.forEach((project) => {
    const projectInList = updatedProjects.find((candidate) => candidate.id === project.id)
    if (!projectInList) {
      return
    }

    const projectTracks = getProjectTracks(project)
    const eligibleJudges = judges.filter((judge) => canJudgeSubmission(judge, projectTracks))
    const sortedEligibleJudges = [...eligibleJudges].sort(
      (a, b) =>
        (judgeAssignmentCount.get(a.name) ?? 0) -
        (judgeAssignmentCount.get(b.name) ?? 0),
    )

    for (const judge of sortedEligibleJudges) {
      if (projectInList.assignedJudges.length >= targetJudgesPerProject) {
        break
      }
      if (projectInList.assignedJudges.includes(judge.name)) {
        continue
      }
      projectInList.assignedJudges.push(judge.name)
      judgeAssignmentCount.set(judge.name, (judgeAssignmentCount.get(judge.name) ?? 0) + 1)
    }

    if (projectInList.assignedJudges.length < MIN_REQUIRED_JUDGES_PER_PROJECT) {
      const fallbackJudge = [...judges]
        .sort(
          (a, b) =>
            (judgeAssignmentCount.get(a.name) ?? 0) -
            (judgeAssignmentCount.get(b.name) ?? 0),
        )
        .find((judge) => !projectInList.assignedJudges.includes(judge.name))

      if (fallbackJudge) {
        projectInList.assignedJudges.push(fallbackJudge.name)
        judgeAssignmentCount.set(
          fallbackJudge.name,
          (judgeAssignmentCount.get(fallbackJudge.name) ?? 0) + 1,
        )
      }
    }

    if (projectInList.assignedJudges.length < MIN_JUDGES_PER_PROJECT) {
      underAssignedProjects.push({
        projectName: projectInList.name,
        assigned: projectInList.assignedJudges.length,
        minimumRequired: MIN_JUDGES_PER_PROJECT,
        eligibleJudges: eligibleJudges.length,
      })
    }
  })

  return {
    updatedProjects,
    judgeAssignedCountByName: judgeAssignmentCount,
    underAssignedProjects,
  }
}

type ScheduleSubmission = {
  submissionId: string
  judgeIds: string[]
}

type BuildScheduleInput = {
  submissions: ScheduleSubmission[]
  rooms: Room[]
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

export const buildScheduleWithMinimalRoomMoves = (
  input: BuildScheduleInput,
): BuildScheduleResult => {
  const {
    submissions,
    rooms,
    scheduleDate,
    startTime,
    endTime,
    slotDurationMinutes,
  } = input

  const slots: ScheduleSlot[] = []
  const lastRoomByJudge = new Map<string, number>()
  let roomMoveCount = 0
  let unscheduled = [...submissions]

  let currentSlotStart = timeToMinutes(startTime)
  const scheduleEnd = timeToMinutes(endTime)

  while (
    unscheduled.length > 0 &&
    currentSlotStart + slotDurationMinutes <= scheduleEnd
  ) {
    const judgesUsedThisSlot = new Set<string>()
    const assignmentsThisSlot: Array<{ roomId: number; unscheduledIndex: number }> = []
    const pickedSubmissionIndexes = new Set<number>()

    for (const room of rooms) {
      let bestIndex = -1
      let bestMoveCost = Number.POSITIVE_INFINITY
      let bestStayScore = Number.NEGATIVE_INFINITY

      unscheduled.forEach((submission, index) => {
        if (pickedSubmissionIndexes.has(index)) {
          return
        }
        if (submission.judgeIds.some((judgeId) => judgesUsedThisSlot.has(judgeId))) {
          return
        }

        let moveCost = 0
        let stayScore = 0

        submission.judgeIds.forEach((judgeId) => {
          const previousRoom = lastRoomByJudge.get(judgeId)
          if (previousRoom === undefined) {
            return
          }
          if (previousRoom === room.id) {
            stayScore += 1
          } else {
            moveCost += 1
          }
        })

        const isBetter =
          moveCost < bestMoveCost ||
          (moveCost === bestMoveCost && stayScore > bestStayScore)

        if (isBetter) {
          bestIndex = index
          bestMoveCost = moveCost
          bestStayScore = stayScore
        }
      })

      if (bestIndex === -1) {
        continue
      }

      assignmentsThisSlot.push({ roomId: room.id, unscheduledIndex: bestIndex })
      pickedSubmissionIndexes.add(bestIndex)

      const selectedSubmission = unscheduled[bestIndex]
      selectedSubmission.judgeIds.forEach((judgeId) => judgesUsedThisSlot.add(judgeId))
    }

    assignmentsThisSlot.forEach(({ roomId, unscheduledIndex }) => {
      const submission = unscheduled[unscheduledIndex]
      const slotStart = minutesToTime(currentSlotStart)
      const slotEnd = minutesToTime(currentSlotStart + slotDurationMinutes)

      submission.judgeIds.forEach((judgeId) => {
        const previousRoom = lastRoomByJudge.get(judgeId)
        if (previousRoom !== undefined && previousRoom !== roomId) {
          roomMoveCount += 1
        }
      })

      slots.push({
        date: scheduleDate,
        start_time: slotStart,
        end_time: slotEnd,
        submission_id: submission.submissionId,
        room_id: roomId,
        judge_ids: submission.judgeIds,
      })

      submission.judgeIds.forEach((judgeId) => {
        lastRoomByJudge.set(judgeId, roomId)
      })
    })

    unscheduled = unscheduled.filter((_, index) => !pickedSubmissionIndexes.has(index))
    currentSlotStart += slotDurationMinutes
  }

  return {
    slots,
    unscheduledSubmissionIds: unscheduled.map((submission) => submission.submissionId),
    roomMoveCount,
  }
}
