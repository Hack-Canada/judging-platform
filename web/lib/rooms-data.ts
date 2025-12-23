export type Room = {
  id: number
  name: string
  description?: string
}

export const defaultRooms: Room[] = [
  { id: 1, name: "Room A", description: "Main judging room" },
  { id: 2, name: "Room B", description: "Secondary judging room" },
  { id: 3, name: "Room C", description: "Small judging room" },
]
