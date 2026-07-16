import {
  DashboardSquare01Icon,
  Calendar01Icon,
  CalendarCheckIn01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export interface SponsorNavItem {
  title: string;
  url: string;
  icon: IconSvgElement;
}

export const sponsorNavItems: SponsorNavItem[] = [
  {
    title: "Sponsor Dashboard",
    url: "/sponsor",
    icon: DashboardSquare01Icon,
  },
  {
    title: "Schedule",
    url: "/sponsor/schedule",
    icon: Calendar01Icon,
  },
  {
    title: "Check-In",
    url: "/sponsor/check-in",
    icon: CalendarCheckIn01Icon,
  },
];
