export type AdminProject = {
  id: number
  name: string
  assignedJudges: string[]
  totalInvestment: number
  tracks: string[] // Track names (e.g. ["General", "RBC Track"])
  submissionId?: string // UUID from submissions table
}

