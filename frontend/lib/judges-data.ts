export type Judge = {
  id: number
  name: string
  email: string
  assignedProjects: number
  totalInvested: number
  tracks: string[] // Array of track names this judge can judge (e.g., ["Uber Track", "General"])
}

