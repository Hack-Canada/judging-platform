import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Schedule",
  description: "Full schedule overview — all projects, rooms, judges, and time slots for HackCanada 2026.",
}

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return children
}
