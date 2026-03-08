import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics",
  description: "Real-time PostHog analytics for HackCanada — live users, page views, event tracking, and session insights.",
  keywords: ["analytics", "posthog", "real-time", "traffic", "events", "sessions"],
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children
}
