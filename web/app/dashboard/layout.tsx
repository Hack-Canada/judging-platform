import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Main dashboard for HackCanada judging platform. View submission statistics, review progress, and track judging metrics.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
