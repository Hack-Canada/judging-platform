export type Judge = {
  id: number
  name: string
  email: string
  assignedProjects: number
  totalInvested: number
  tracks: string[] // Array of track names this judge can judge (e.g., ["Uber Track", "General"])
}

export const defaultJudges: Judge[] = [
  { id: 1, name: "Sarah Chen", email: "sarah@example.com", assignedProjects: 20, totalInvested: 1250, tracks: ["General"] },
  { id: 2, name: "Michael Torres", email: "michael@example.com", assignedProjects: 20, totalInvested: 890, tracks: ["General"] },
  { id: 3, name: "Emily Johnson", email: "emily@example.com", assignedProjects: 20, totalInvested: 2100, tracks: ["General"] },
  { id: 4, name: "David Kim", email: "david@example.com", assignedProjects: 20, totalInvested: 450, tracks: ["Uber Track", "General"] },
  { id: 5, name: "Alexandra Martinez", email: "alexandra@example.com", assignedProjects: 20, totalInvested: 1650, tracks: ["RBC Track", "General"] },
]
