import {
  DashboardSquare01Icon,
  Calendar01Icon,
  Calendar03Icon,
  CalendarCheckIn01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export interface VolunteerNavItem {
  title: string;
  url: string;
  icon: IconSvgElement;
}

export const volunteerNavItems: VolunteerNavItem[] = [
  {
    title: "Volunteer Dashboard",
    url: "/volunteer",
    icon: DashboardSquare01Icon,
  },
  {
    title: "Shift Schedule",
    url: "/volunteer/shift-schedule",
    icon: Calendar01Icon,
  },
  {
    title: "Event Schedule",
    url: "/volunteer/event-schedule",
    icon: Calendar03Icon,
  },
  {
    title: "Check-In",
    url: "/volunteer/check-in",
    icon: CalendarCheckIn01Icon,
  },
];
