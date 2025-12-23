export type AdminProject = {
  id: number
  name: string
  assignedJudges: string[]
  totalInvestment: number
  track: string // Track name
  submissionId?: string // UUID from submissions table
}

