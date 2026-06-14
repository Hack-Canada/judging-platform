import { NextResponse } from "next/server"
import { requireAdminOrSuperadmin } from "@/lib/api-auth"

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID

type HogQLResult = { results: (string | number)[][]; columns: string[] }

function intervalFor(range: string): string {
  if (range === "7d") return "7 DAY"
  if (range === "30d") return "30 DAY"
  return "24 HOUR"
}

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

  const { searchParams } = new URL(request.url)
  const range = searchParams.get("range") ?? "24h"
  const interval = intervalFor(range)

  // For hourly trend: use hours for 24h, days for 7d/30d
  const trendGroupBy = range === "24h"
    ? `toStartOfHour(timestamp) AS hour`
    : `toStartOfDay(timestamp) AS hour`

  const [eventsBreakdown, uniqueVisitors, trend, live, recent, topPages, browserBreakdown] =
    await Promise.allSettled([
      // Event counts by type
      hogql(
        `SELECT event, count() AS cnt FROM events WHERE timestamp > now() - INTERVAL ${interval} GROUP BY event ORDER BY cnt DESC LIMIT 25`
      ),
      // Unique visitors
      hogql(
        `SELECT count(DISTINCT distinct_id) AS visitors FROM events WHERE timestamp > now() - INTERVAL ${interval} AND event = '$pageview'`
      ),
      // Hourly/daily page-view trend
      hogql(
        `SELECT ${trendGroupBy}, count() AS views FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL ${interval} GROUP BY hour ORDER BY hour ASC`
      ),
      // Live users — last 5 min (always 5 min regardless of range)
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
      // Top pages by views
      hogql(
        `SELECT properties.$current_url AS url, count() AS views FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL ${interval} AND properties.$current_url IS NOT NULL GROUP BY url ORDER BY views DESC LIMIT 10`
      ),
      // Browser breakdown
      hogql(
        `SELECT properties.$browser AS browser, count() AS cnt FROM events WHERE timestamp > now() - INTERVAL ${interval} AND properties.$browser IS NOT NULL GROUP BY browser ORDER BY cnt DESC LIMIT 8`
      ),
    ])

  return NextResponse.json({
    configured: true,
    fetchedAt: new Date().toISOString(),
    range,
    eventsBreakdown: wrap(eventsBreakdown),
    uniqueVisitors: wrap(uniqueVisitors),
    trend: wrap(trend),
    live: wrap(live),
    recent: wrap(recent),
    topPages: wrap(topPages),
    browserBreakdown: wrap(browserBreakdown),
  })
}
