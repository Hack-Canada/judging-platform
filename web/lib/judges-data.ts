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
  // Additional judges to increase scheduling capacity
  { id: 6, name: "Noah Patel", email: "noah@example.com", assignedProjects: 15, totalInvested: 980, tracks: ["General"] },
  { id: 7, name: "Olivia Nguyen", email: "olivia@example.com", assignedProjects: 18, totalInvested: 1320, tracks: ["General"] },
  { id: 8, name: "Liam O'Connor", email: "liam@example.com", assignedProjects: 16, totalInvested: 1100, tracks: ["General", "Uber Track"] },
  { id: 9, name: "Ava Singh", email: "ava@example.com", assignedProjects: 17, totalInvested: 1450, tracks: ["General", "RBC Track"] },
  { id: 10, name: "Ethan Garcia", email: "ethan@example.com", assignedProjects: 19, totalInvested: 1230, tracks: ["General"] },
]
