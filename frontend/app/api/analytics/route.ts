import { NextResponse } from "next/server"
import { requireAdminOrSuperadmin } from "@/lib/api-auth"

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID

type HogQLResult = { results: (string | number)[][]; columns: string[] }

async function hogql(query: string): Promise<HogQLResult> {
  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      // no cache — always fresh
      cache: "no-store",
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PostHog ${res.status}: ${text.slice(0, 300)}`)
  }
  return res.json() as Promise<HogQLResult>
}

async function eventsQuery(
  select: string[],
  orderBy: string[],
  limit: number
): Promise<HogQLResult> {
  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: { kind: "EventsQuery", select, orderBy, limit },
      }),
      cache: "no-store",
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PostHog ${res.status}: ${text.slice(0, 300)}`)
  }
  return res.json() as Promise<HogQLResult>
}

function wrap(r: PromiseSettledResult<HogQLResult>) {
  return r.status === "fulfilled"
    ? { data: r.value, error: null }
    : { data: null, error: r.reason instanceof Error ? r.reason.message : "Failed" }
}

export async function GET(request: Request) {
  // Return unconfigured status gracefully so the page can still render
  if (!POSTHOG_PERSONAL_API_KEY || !POSTHOG_PROJECT_ID) {
    return NextResponse.json({ configured: false })
  }

  const authResult = await requireAdminOrSuperadmin(request)
  if (!authResult.ok) return authResult.response

  const [eventsBreakdown, uniqueVisitors, trend, live, recent, topPages] =
    await Promise.allSettled([
      // Event counts by type — last 24 h
      hogql(
        "SELECT event, count() AS cnt FROM events WHERE timestamp > now() - INTERVAL 24 HOUR GROUP BY event ORDER BY cnt DESC LIMIT 25"
      ),
      // Unique visitors — last 24 h
      hogql(
        "SELECT count(DISTINCT distinct_id) AS visitors FROM events WHERE timestamp > now() - INTERVAL 24 HOUR AND event = '$pageview'"
      ),
      // Hourly page-view trend — last 24 h
      hogql(
        "SELECT toStartOfHour(timestamp) AS hour, count() AS views FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 24 HOUR GROUP BY hour ORDER BY hour ASC"
      ),
      // Live users — last 5 min
      hogql(
        "SELECT count(DISTINCT distinct_id) AS live FROM events WHERE timestamp > now() - INTERVAL 5 MINUTE"
      ),
      // Recent events feed
      eventsQuery(
        [
          "event",
          "timestamp",
          "distinct_id",
          "properties.$current_url",
          "properties.$browser",
          "properties.$os",
        ],
        ["-timestamp"],
        30
      ),
      // Top pages by views — last 24 h
      hogql(
        "SELECT properties.$current_url AS url, count() AS views FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 24 HOUR AND properties.$current_url IS NOT NULL GROUP BY url ORDER BY views DESC LIMIT 10"
      ),
    ])

  return NextResponse.json({
    configured: true,
    fetchedAt: new Date().toISOString(),
    eventsBreakdown: wrap(eventsBreakdown),
    uniqueVisitors: wrap(uniqueVisitors),
    trend: wrap(trend),
    live: wrap(live),
    recent: wrap(recent),
    topPages: wrap(topPages),
  })
}
