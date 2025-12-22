export type Room = {
  id: number
  name: string
  capacity?: number
  description?: string
}

export const defaultRooms: Room[] = [
  { id: 1, name: "Room A", capacity: 20, description: "Main judging room" },
  { id: 2, name: "Room B", capacity: 15, description: "Secondary judging room" },
  { id: 3, name: "Room C", capacity: 10, description: "Small judging room" },
]
