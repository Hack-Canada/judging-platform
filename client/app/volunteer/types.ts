export type ShiftStatus = "current" | "upcoming" | "completed";

export interface Shift {
  id: string;
  title: string;
  role: string;
  location: string;
  teamLead: string;
  startTime: string;
  endTime: string;
  description: string;
  status: ShiftStatus;
}
