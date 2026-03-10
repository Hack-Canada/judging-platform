"use client"

import * as React from "react"
import {
  IconRefresh,
  IconUsers,
  IconEye,
  IconLogin,
  IconCalendarCheck,
  IconAlertCircle,
  IconActivity,
  IconChartBar,
  IconWorld,
  IconClock,
  IconTrophy,
  IconTarget,
  IconDeviceLaptop,
  IconCheck,
} from "@tabler/icons-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase-client"

// ─── Types ────────────────────────────────────────────────────────────────────

type HogResult = { results: (string | number)[][]; columns: string[] } | null

interface AnalyticsPayload {
  configured: boolean
  fetchedAt?: string
  range?: string
  eventsBreakdown?: { data: HogResult; error: string | null }
  uniqueVisitors?: { data: HogResult; error: string | null }
  trend?: { data: HogResult; error: string | null }
  live?: { data: HogResult; error: string | null }
  recent?: { data: HogResult; error: string | null }
  topPages?: { data: HogResult; error: string | null }
  browserBreakdown?: { data: HogResult; error: string | null }
}

interface JudgingJudge {
  id: string
  name: string
  assigned_projects: number
  tracks: string[]
}

interface JudgingSubmission {
  id: string
  project_name: string
  team_name: string
  tracks: string[]
  members: string[]
  submitted_at: string
}

interface JudgingAssignment {
  judge_id: string
  submission_id: string
}

interface JudgingInvestment {
  judge_id: string
  submission_id: string
  amount: number
}

interface JudgingPayload {
  judges: JudgingJudge[]
  submissions: JudgingSubmission[]
  assignments: JudgingAssignment[]
  investments: JudgingInvestment[]
  fetchedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseRows(data: HogResult): Record<string, string | number>[] {
  if (!data?.results || !data.columns) return []
  return data.results.map((row) => {
    const obj: Record<string, string | number> = {}
    data.columns.forEach((col, i) => {
      obj[col] = row[i] as string | number
    })
    return obj
  })
}

function getEventCount(rows: Record<string, string | number>[], eventName: string): number {
  const row = rows.find((r) => r.event === eventName)
  return row ? Number(row.cnt ?? 0) : 0
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function fmtTime(ts: string | number): string {
  try {
    return new Date(String(ts)).toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch {
    return String(ts)
  }
}

function fmtHour(ts: string | number, range: string): string {
  try {
    const d = new Date(String(ts))
    if (range === "24h") {
      return d.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false })
    }
    return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" })
  } catch {
    return String(ts)
  }
}

function stripOrigin(url: string | number): string {
  try {
    const u = new URL(String(url))
    return u.pathname + (u.search || "")
  } catch {
    return String(url)
  }
}

function timeAgo(ts: string | number): string {
  try {
    const diff = Math.floor((Date.now() - new Date(String(ts)).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  } catch {
    return ""
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  accent?: "green" | "blue" | "purple" | "orange" | "rose"
  loading?: boolean
}

const ACCENT_STYLES: Record<NonNullable<StatCardProps["accent"]>, { bg: string; text: string; dot?: string }> = {
  green: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" },
}

function StatCard({ title, value, subtitle, icon: Icon, accent = "blue", loading }: StatCardProps) {
  const style = ACCENT_STYLES[accent]
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">{title}</CardDescription>
          <div className={`flex h-8 w-8 items-center justify-center rounded-md ${style.bg}`}>
            <Icon className={`h-4 w-4 ${style.text}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
        ) : (
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold tabular-nums">{value}</span>
            {accent === "green" && style.dot && (
              <span className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                <span className={`inline-block h-2 w-2 animate-pulse rounded-full ${style.dot}`} />
                live
              </span>
            )}
          </div>
        )}
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} views</p>
    </div>
  )
}

// ─── Event label formatting ───────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  $pageview: "Page View",
  $pageleave: "Page Leave",
  $autocapture: "Auto Capture",
  judge_login: "Judge Login",
  admin_login: "Admin Login",
  login_failed: "Login Failed",
  schedule_saved: "Schedule Saved",
  slot_assigned: "Slot Assigned",
}

function fmtEvent(name: string): string {
  return EVENT_LABELS[name] ?? name
}

const EVENT_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#14b8a6",
]

const RANGE_LABELS: Record<string, string> = {
  "24h": "last 24 h",
  "7d": "last 7 days",
  "30d": "last 30 days",
}

// ─── Web Analytics Tab ────────────────────────────────────────────────────────

function WebAnalyticsTab() {
  const [data, setData] = React.useState<AnalyticsPayload | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [countdown, setCountdown] = React.useState(30)
  const [range, setRange] = React.useState<"24h" | "7d" | "30d">("24h")

  const fetchAnalytics = React.useCallback(async (showRefreshing = false, r = range) => {
    try {
      if (showRefreshing) setRefreshing(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`/api/analytics?range=${r}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const json = await res.json() as AnalyticsPayload
      setData(json)
      setError(null)
      setCountdown(30)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [range])

  React.useEffect(() => {
    setLoading(true)
    void fetchAnalytics(false, range)
  }, [range]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 30 s
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          void fetchAnalytics()
          return 30
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [fetchAnalytics])

  // ── Derived data ─────────────────────────────────────────────────────────

  const eventRows = parseRows(data?.eventsBreakdown?.data ?? null)
  const trendRows = parseRows(data?.trend?.data ?? null)
  const recentRows = parseRows(data?.recent?.data ?? null)
  const topPageRows = parseRows(data?.topPages?.data ?? null)
  const browserRows = parseRows(data?.browserBreakdown?.data ?? null)

  const liveRaw = data?.live?.data?.results?.[0]?.[0]
  const liveUsers = liveRaw != null ? Number(liveRaw) : null

  const visitorsRaw = data?.uniqueVisitors?.data?.results?.[0]?.[0]
  const uniqueVisitors = visitorsRaw != null ? Number(visitorsRaw) : null

  const pageViews = getEventCount(eventRows, "$pageview")
  const judgeLogins = getEventCount(eventRows, "judge_login")
  const adminLogins = getEventCount(eventRows, "admin_login")
  const scheduleSaves = getEventCount(eventRows, "schedule_saved")
  const slotsAssigned = getEventCount(eventRows, "slot_assigned")
  const loginsFailed = getEventCount(eventRows, "login_failed")

  const trendChartData = trendRows.map((r) => ({
    hour: fmtHour(r.hour, range),
    views: Number(r.views),
  }))

  const HIDDEN_EVENTS = new Set(["$autocapture", "$pageleave", "$identify", "$set", "$pageview"])
  const breakdownChartData = eventRows
    .filter((r) => !HIDDEN_EVENTS.has(String(r.event)))
    .slice(0, 8)
    .map((r) => ({
      name: fmtEvent(String(r.event)),
      count: Number(r.cnt),
    }))

  const browserChartData = browserRows.map((r) => ({
    name: String(r.browser),
    count: Number(r.cnt),
  }))

  const rangeLabel = RANGE_LABELS[range]

  if (data && !data.configured) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <IconAlertCircle className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm text-amber-600 dark:text-amber-400">
              PostHog server-side keys not configured
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p className="mb-2">
            Add the following to <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env.local</code> and Vercel project settings to enable the analytics dashboard:
          </p>
          <pre className="rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
{`POSTHOG_PERSONAL_API_KEY=phx_...   # PostHog → Settings → Personal API keys
POSTHOG_PROJECT_ID=12345            # PostHog → Project settings → Project ID`}
          </pre>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header row with range selector + refresh */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          PostHog · {rangeLabel}
          {data?.fetchedAt && (
            <span className="ml-2 text-muted-foreground/60">
              · updated {fmtTime(data.fetchedAt)}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex rounded-md border">
            {(["24h", "7d", "30d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                  range === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">
            refresh in {countdown}s
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="gap-1.5"
          >
            <IconRefresh className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-rose-500/40 bg-rose-500/5">
          <CardContent className="flex items-center gap-2 pt-4 text-sm text-rose-600 dark:text-rose-400">
            <IconAlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Live now"
          value={liveUsers ?? "—"}
          subtitle="active in last 5 min"
          icon={IconActivity}
          accent="green"
          loading={loading}
        />
        <StatCard
          title="Page Views"
          value={loading ? "—" : fmtNum(pageViews)}
          subtitle={rangeLabel}
          icon={IconEye}
          accent="blue"
          loading={loading}
        />
        <StatCard
          title="Unique Visitors"
          value={loading ? "—" : uniqueVisitors != null ? fmtNum(uniqueVisitors) : "—"}
          subtitle={rangeLabel}
          icon={IconUsers}
          accent="purple"
          loading={loading}
        />
        <StatCard
          title="Judge Logins"
          value={loading ? "—" : judgeLogins + adminLogins}
          subtitle={`${judgeLogins} judge · ${adminLogins} admin`}
          icon={IconLogin}
          accent="orange"
          loading={loading}
        />
        <StatCard
          title="Schedule Saves"
          value={loading ? "—" : scheduleSaves}
          subtitle="calendar saves"
          icon={IconCalendarCheck}
          accent="blue"
          loading={loading}
        />
        <StatCard
          title="Slots Assigned"
          value={loading ? "—" : slotsAssigned}
          subtitle={loginsFailed > 0 ? `${loginsFailed} login failures` : "no login failures"}
          icon={IconChartBar}
          accent={loginsFailed > 0 ? "rose" : "blue"}
          loading={loading}
        />
      </div>

      {/* Charts row 1: trend + event breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Page Views — Trend</CardTitle>
            <CardDescription>{rangeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-52 animate-pulse rounded-md bg-muted" />
            ) : trendChartData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={trendChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custom Event Breakdown</CardTitle>
            <CardDescription>{rangeLabel} · excluding page views</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-52 animate-pulse rounded-md bg-muted" />
            ) : breakdownChartData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">No custom events yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={breakdownChartData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={100}
                  />
                  <Tooltip
                    formatter={(v: number) => [v, "events"]}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--background))",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {breakdownChartData.map((_, i) => (
                      <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2: top pages + browser breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconWorld className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Top Pages</CardTitle>
            </div>
            <CardDescription>By page views, {rangeLabel}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : topPageRows.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No page view data yet</p>
            ) : (
              <div className="divide-y">
                {topPageRows.map((row, i) => {
                  const path = stripOrigin(row.url)
                  const views = Number(row.views)
                  const maxViews = Number(topPageRows[0]?.views ?? 1)
                  const pct = Math.round((views / maxViews) * 100)
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-5 text-right text-xs text-muted-foreground">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{path}</p>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/60"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums">{fmtNum(views)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Browser breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconDeviceLaptop className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Browser Breakdown</CardTitle>
            </div>
            <CardDescription>{rangeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-52 animate-pulse rounded-md bg-muted" />
            ) : browserChartData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">No browser data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={browserChartData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(v: number) => [v, "events"]}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--background))",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {browserChartData.map((_, i) => (
                      <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent events feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconClock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Recent Events</CardTitle>
          </div>
          <CardDescription>Live feed · last 30 events</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : recentRows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No events yet</p>
          ) : (
            <div className="max-h-[420px] divide-y overflow-y-auto">
              {recentRows.map((row, i) => {
                const eventName = String(row.event ?? "")
                const ts = String(row.timestamp ?? "")
                const url = row["properties.$current_url"]
                  ? stripOrigin(row["properties.$current_url"])
                  : null
                const browser = String(row["properties.$browser"] ?? "")
                const isCustom = !eventName.startsWith("$")
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <div className="mt-0.5 shrink-0">
                      {isCustom ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        </span>
                      ) : (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-sm font-medium ${isCustom ? "text-primary" : "text-foreground"}`}
                        >
                          {fmtEvent(eventName)}
                        </span>
                        {browser && (
                          <Badge variant="secondary" className="h-4 px-1 py-0 text-[10px]">
                            {browser}
                          </Badge>
                        )}
                      </div>
                      {url && <p className="truncate text-xs text-muted-foreground">{url}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(ts)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Judging Analytics Tab ────────────────────────────────────────────────────

interface CsvTrackData {
  totalTeams: number
  trackData: { track: string; count: number }[]
}

function JudgingAnalyticsTab() {
  const [data, setData] = React.useState<JudgingPayload | null>(null)
  const [csvTracks, setCsvTracks] = React.useState<CsvTrackData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [countdown, setCountdown] = React.useState(30)
  const [hasLoaded, setHasLoaded] = React.useState(false)

  const fetchJudging = React.useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [judgingRes, tracksRes] = await Promise.all([
        fetch("/api/analytics/judging", { headers, cache: "no-store" }),
        fetch("/api/analytics/tracks", { headers, cache: "no-store" }),
      ])

      if (!judgingRes.ok) {
        const body = await judgingRes.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${judgingRes.status}`)
      }
      const json = await judgingRes.json() as JudgingPayload
      setData(json)

      if (tracksRes.ok) {
        const tracksJson = await tracksRes.json() as CsvTrackData
        setCsvTracks(tracksJson)
      }

      setError(null)
      setCountdown(30)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load judging analytics")
    } finally {
      setLoading(false)
      setRefreshing(false)
      setHasLoaded(true)
    }
  }, [])

  React.useEffect(() => {
    if (!hasLoaded) void fetchJudging()
  }, [fetchJudging, hasLoaded])

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          void fetchJudging()
          return 30
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [fetchJudging])

  // ── Derived data ─────────────────────────────────────────────────────────

  const judges = data?.judges ?? []
  const submissions = data?.submissions ?? []
  const assignments = data?.assignments ?? []
  const investments = data?.investments ?? []

  // Per-judge scoring progress
  const judgeProgress = judges.map((judge) => {
    const assigned = assignments.filter((a) => a.judge_id === judge.id)
    const scored = new Set(
      investments.filter((inv) => inv.judge_id === judge.id).map((inv) => inv.submission_id)
    )
    const assignedCount = assigned.length
    const scoredCount = scored.size
    const completionPct = assignedCount > 0 ? Math.round((scoredCount / assignedCount) * 100) : 0
    return { ...judge, assignedCount, scoredCount, completionPct }
  }).sort((a, b) => a.completionPct - b.completionPct)

  // Per-project score stats
  const projectScores = submissions.map((sub) => {
    const scores = investments.filter((inv) => inv.submission_id === sub.id).map((inv) => Number(inv.amount))
    const judgeCount = scores.length
    const avgScore = judgeCount > 0 ? scores.reduce((s, v) => s + v, 0) / judgeCount : null
    return { ...sub, judgeCount, avgScore }
  }).sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1))

  // Summary stats
  const totalProjects = submissions.length
  const totalJudges = judges.length
  const projectsScored = projectScores.filter((p) => p.judgeCount >= 1).length
  const TARGET = 3
  const fullyJudged = projectScores.filter((p) => p.judgeCount >= TARGET).length
  const completionPct = totalProjects > 0 ? Math.round((fullyJudged / totalProjects) * 100) : 0

  // Score distribution buckets
  const scoredProjects = projectScores.filter((p) => p.avgScore !== null)
  const buckets = [
    { label: "0–2", min: 0, max: 2 },
    { label: "2–4", min: 2, max: 4 },
    { label: "4–6", min: 4, max: 6 },
    { label: "6–8", min: 6, max: 8 },
    { label: "8–10", min: 8, max: 10.01 },
  ]
  const scoreDistData = buckets.map(({ label, min, max }) => ({
    label,
    count: scoredProjects.filter((p) => (p.avgScore ?? 0) >= min && (p.avgScore ?? 0) < max).length,
  }))

  // Track breakdown — unnest tracks[]
  const trackCounts: Record<string, number> = {}
  submissions.forEach((sub) => {
    (sub.tracks ?? []).forEach((track) => {
      trackCounts[track] = (trackCounts[track] ?? 0) + 1
    })
  })
  const trackData = Object.entries(trackCounts)
    .map(([track, count]) => ({ track, count }))
    .sort((a, b) => b.count - a.count)

  if (error) {
    return (
      <Card className="border-rose-500/40 bg-rose-500/5">
        <CardContent className="flex items-center gap-2 pt-4 text-sm text-rose-600 dark:text-rose-400">
          <IconAlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Supabase · live judging data
          {data?.fetchedAt && (
            <span className="ml-2 text-muted-foreground/60">
              · updated {fmtTime(data.fetchedAt)}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:block">
            refresh in {countdown}s
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchJudging(true)}
            disabled={refreshing}
            className="gap-1.5"
          >
            <IconRefresh className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Projects"
          value={loading ? "—" : csvTracks?.totalTeams ?? totalProjects}
          subtitle={csvTracks ? "from Devpost" : "submitted"}
          icon={IconChartBar}
          accent="blue"
          loading={loading}
        />
        <StatCard
          title="Total Judges"
          value={loading ? "—" : totalJudges}
          subtitle="registered"
          icon={IconUsers}
          accent="purple"
          loading={loading}
        />
        <StatCard
          title="Projects Scored"
          value={loading ? "—" : projectsScored}
          subtitle="≥ 1 score recorded"
          icon={IconTarget}
          accent="orange"
          loading={loading}
        />
        <StatCard
          title="Fully Judged"
          value={loading ? "—" : fullyJudged}
          subtitle={`≥ ${TARGET} judges scored`}
          icon={IconCheck}
          accent="green"
          loading={loading}
        />
        <StatCard
          title="Completion"
          value={loading ? "—" : `${completionPct}%`}
          subtitle={`${fullyJudged} of ${totalProjects} projects`}
          icon={IconTrophy}
          accent="blue"
          loading={loading}
        />
      </div>

      {/* Charts row: score distribution + track breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Distribution</CardTitle>
            <CardDescription>Projects by average score bucket</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-52 animate-pulse rounded-md bg-muted" />
            ) : scoredProjects.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">No scores yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={scoreDistData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [v, "projects"]}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--background))",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {scoreDistData.map((_, i) => (
                      <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projects per Track</CardTitle>
            <CardDescription>Submission breakdown by track</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-52 animate-pulse rounded-md bg-muted" />
            ) : trackData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">No track data</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={trackData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="track"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={90}
                  />
                  <Tooltip
                    formatter={(v: number) => [v, "projects"]}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--background))",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {trackData.map((_, i) => (
                      <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Track summary table — sourced from Devpost CSV */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconTarget className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Teams per Track</CardTitle>
          </div>
          <CardDescription>
            {csvTracks
              ? `${csvTracks.totalTeams} total teams · sourced from Devpost export`
              : "Number of teams that applied to each track"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !csvTracks || csvTracks.trackData.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No track data yet</p>
          ) : (
            <div className="divide-y">
              {csvTracks.trackData.map(({ track, count }, i) => {
                const pct = Math.round((count / csvTracks.trackData[0].count) * 100)
                return (
                  <div key={track} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-5 text-right text-xs text-muted-foreground">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{track}</p>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: EVENT_COLORS[i % EVENT_COLORS.length] }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums">{count}</span>
                    <span className="shrink-0 w-10 text-right text-xs text-muted-foreground">
                      {Math.round((count / csvTracks.totalTeams) * 100)}%
                    </span>
                  </div>
                )
              })}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/30">
                <span className="w-5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    {csvTracks.totalTeams} teams · {csvTracks.trackData.reduce((s, t) => s + t.count, 0)} total track entries (teams may apply to multiple)
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">
                  {csvTracks.trackData.reduce((s, t) => s + t.count, 0)}
                </span>
                <span className="shrink-0 w-10" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tables row: leaderboard + judge progress */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Project Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconTrophy className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Project Leaderboard</CardTitle>
            </div>
            <CardDescription>Ranked by average score · top 20</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : projectScores.filter((p) => p.judgeCount > 0).length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No scores recorded yet</p>
            ) : (
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="py-2 pl-4 pr-2 text-left text-xs font-medium text-muted-foreground">#</th>
                      <th className="py-2 px-2 text-left text-xs font-medium text-muted-foreground">Project</th>
                      <th className="py-2 px-2 text-left text-xs font-medium text-muted-foreground">Track</th>
                      <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground">Avg</th>
                      <th className="py-2 pl-2 pr-4 text-right text-xs font-medium text-muted-foreground">Judges</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {projectScores.slice(0, 20).map((project, i) => (
                      <tr key={project.id} className="hover:bg-muted/30">
                        <td className="py-2 pl-4 pr-2 text-xs text-muted-foreground">{i + 1}</td>
                        <td className="py-2 px-2">
                          <p className="font-medium leading-tight">{project.project_name}</p>
                          <p className="text-xs text-muted-foreground">{project.team_name}</p>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex flex-wrap gap-1">
                            {(project.tracks ?? []).slice(0, 2).map((t) => (
                              <Badge key={t} variant="secondary" className="h-4 px-1 py-0 text-[10px]">{t}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {project.avgScore !== null ? project.avgScore.toFixed(1) : "—"}
                        </td>
                        <td className="py-2 pl-2 pr-4 text-right tabular-nums text-muted-foreground">
                          {project.judgeCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Judge Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconUsers className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Judge Progress</CardTitle>
            </div>
            <CardDescription>Sorted by completion · stragglers first</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : judgeProgress.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No judges registered</p>
            ) : (
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="py-2 pl-4 pr-2 text-left text-xs font-medium text-muted-foreground">Judge</th>
                      <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground">Assigned</th>
                      <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground">Scored</th>
                      <th className="py-2 pl-2 pr-4 text-right text-xs font-medium text-muted-foreground">Done</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {judgeProgress.map((judge) => {
                      const pct = judge.completionPct
                      const color =
                        pct >= 80
                          ? "text-green-600 dark:text-green-400"
                          : pct >= 40
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                      return (
                        <tr key={judge.id} className="hover:bg-muted/30">
                          <td className="py-2 pl-4 pr-2 font-medium">{judge.name}</td>
                          <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">
                            {judge.assignedCount}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">
                            {judge.scoredCount}
                          </td>
                          <td className={`py-2 pl-2 pr-4 text-right font-medium tabular-nums ${color}`}>
                            {pct}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <div className="relative">
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">

            {/* Page header */}
            <div>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Platform insights — web traffic & judging progress
              </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="web">
              <TabsList>
                <TabsTrigger value="web">Web Analytics</TabsTrigger>
                <TabsTrigger value="judging">Judging Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="web" className="mt-6">
                <WebAnalyticsTab />
              </TabsContent>

              <TabsContent value="judging" className="mt-6">
                <JudgingAnalyticsTab />
              </TabsContent>
            </Tabs>

          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
