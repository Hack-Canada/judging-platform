export type TimeSlot = {
  id: string
  startTime: string // Format: "HH:MM" (e.g., "09:00")
  endTime: string // Format: "HH:MM" (e.g., "09:05")
  projectId: number
  projectName: string
  judgeIds: number[]
  judgeNames: string[]
  roomId: number
  roomName: string
}

export type DaySchedule = {
  date: string // Format: "YYYY-MM-DD"
  slots: TimeSlot[]
}

// Generate time slots for a day with dynamic range (30 min before start, 30 min after end, 5-minute intervals)
export function generateTimeSlots(
  date: string, 
  startTime: string = "09:00", 
  endTime: string = "17:00"
): string[] {
  const slots: string[] = []
  
  // Parse start and end times
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)
  
  // Calculate buffer times (30 minutes before start, 30 minutes after end)
  const bufferMinutes = 30
  const startTotalMinutes = startHour * 60 + startMinute - bufferMinutes
  const endTotalMinutes = endHour * 60 + endMinute + bufferMinutes
  
  // Generate slots in 5-minute intervals
  for (let totalMinutes = startTotalMinutes; totalMinutes <= endTotalMinutes; totalMinutes += 5) {
    if (totalMinutes < 0) continue // Skip negative times (before midnight)
    if (totalMinutes >= 24 * 60) break // Skip times after midnight
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    slots.push(timeString)
  }
  
  return slots
}

// Get end time for a 5-minute slot
export function getEndTime(startTime: string, durationMinutes: number = 5): string {
  const [hours, minutes] = startTime.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`
}
