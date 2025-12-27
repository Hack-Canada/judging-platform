import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin dashboard for HackCanada. Manage judges, projects, rooms, and system settings. Configure calendar schedules, investment funds, and auto-assignment rules.",
  keywords: ["admin", "administrator", "settings", "judges", "rooms", "calendar settings", "system configuration"],
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
