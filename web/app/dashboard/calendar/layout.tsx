import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar",
  description: "Schedule hackathon judging sessions. Assign judges to projects in specific rooms and time slots. View and manage the complete judging schedule.",
  keywords: ["calendar", "schedule", "judging schedule", "time slots", "room assignments", "judging sessions"],
};

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
