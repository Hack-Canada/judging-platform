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

export const mockShifts: Shift[] = [
  {
    id: "shift-1",
    title: "Registration Desk",
    role: "Check-in Support",
    location: "Main Entrance",
    teamLead: "Priya Nair",
    startTime: "2026-07-05T09:00:00",
    endTime: "2026-07-05T12:00:00",
    description:
      "Greet hackers as they arrive, verify registration on the check-in app, and hand out badges and swag bags.",
    status: "current",
  },
  {
    id: "shift-2",
    title: "Workshop Room Support",
    role: "Room Monitor",
    location: "Room 204",
    teamLead: "Marcus Chen",
    startTime: "2026-07-05T13:00:00",
    endTime: "2026-07-05T15:00:00",
    description:
      "Help the workshop speaker with AV setup, manage room capacity, and direct attendees to open seats.",
    status: "upcoming",
  },
  {
    id: "shift-3",
    title: "Meal Distribution",
    role: "Food Service",
    location: "Cafeteria",
    teamLead: "Dana Alvarez",
    startTime: "2026-07-05T18:00:00",
    endTime: "2026-07-05T19:30:00",
    description:
      "Set up dinner stations, manage the line, and flag any allergy or dietary accommodation requests to the lead.",
    status: "upcoming",
  },
  {
    id: "shift-4",
    title: "Overnight Security Walk",
    role: "Floor Monitor",
    location: "Floors 1-3",
    teamLead: "Jordan Whitfield",
    startTime: "2026-07-06T00:00:00",
    endTime: "2026-07-06T02:00:00",
    description:
      "Walk assigned floors every 30 minutes, ensure hackers are safe, and report any facility issues to organizers.",
    status: "upcoming",
  },
  {
    id: "shift-5",
    title: "Breakfast Setup",
    role: "Food Service",
    location: "Cafeteria",
    teamLead: "Dana Alvarez",
    startTime: "2026-07-06T07:00:00",
    endTime: "2026-07-06T09:00:00",
    description:
      "Arrange breakfast stations, restock coffee and pastries, and keep the serving area tidy.",
    status: "upcoming",
  },
  {
    id: "shift-6",
    title: "Judging Room Support",
    role: "Room Monitor",
    location: "Main Hall",
    teamLead: "Priya Nair",
    startTime: "2026-07-06T11:00:00",
    endTime: "2026-07-06T14:00:00",
    description:
      "Guide teams to their judging table, keep the schedule on track, and relay timing signals to judges.",
    status: "upcoming",
  },
  {
    id: "shift-7",
    title: "Closing Ceremony Setup",
    role: "Event Support",
    location: "Main Auditorium",
    teamLead: "Sam Okafor",
    startTime: "2026-07-06T15:00:00",
    endTime: "2026-07-06T16:30:00",
    description:
      "Arrange seating, test the microphone and slides, and help direct attendees to the auditorium.",
    status: "upcoming",
  },
  {
    id: "shift-8",
    title: "Venue Teardown",
    role: "Cleanup Crew",
    location: "All Floors",
    teamLead: "Jordan Whitfield",
    startTime: "2026-07-06T17:00:00",
    endTime: "2026-07-06T19:00:00",
    description:
      "Break down signage and furniture, collect leftover swag, and do a final sweep of each room.",
    status: "upcoming",
  },
];
