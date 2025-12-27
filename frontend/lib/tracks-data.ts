export type Track = {
  id: number
  name: string
  description?: string
}

export const defaultTracks: Track[] = [
  { id: 1, name: "General", description: "General category for all projects" },
  { id: 2, name: "RBC Track", description: "RBC sponsor-specific track" },
  { id: 3, name: "Uber Track", description: "Uber sponsor-specific track" },
  { id: 4, name: "Solo Hack", description: "Solo hackathon category" },
  { id: 5, name: "Beginners Hack", description: "For first-time hackers" },
]
