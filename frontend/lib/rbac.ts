import type { User } from "@supabase/supabase-js"

export type AppRole = "hacker" | "judge" | "sponsor" | "admin" | "superadmin"

const DEFAULT_ROLE: AppRole = "hacker"

export const ROLE_HOME: Record<AppRole, string> = {
  hacker: "/submit",
  judge: "/dashboard/judges",
  sponsor: "/dashboard/judges",
  admin: "/dashboard/admin",
  superadmin: "/dashboard/admin",
}

const DASHBOARD_ALLOWLIST: Record<AppRole, string[]> = {
  hacker: [],
  judge: ["/dashboard/judges"],
  sponsor: ["/dashboard/judges"],
  admin: ["/dashboard", "/dashboard/admin", "/dashboard/calendar", "/dashboard/submissions", "/dashboard/hacker-view"],
  superadmin: ["/dashboard", "/dashboard/admin", "/dashboard/calendar", "/dashboard/submissions", "/dashboard/hacker-view", "/dashboard/roles"],
}

export function isAppRole(value: string | undefined | null): value is AppRole {
  return value === "hacker" || value === "judge" || value === "sponsor" || value === "admin" || value === "superadmin"
}

export function getUserRole(user: Pick<User, "user_metadata" | "app_metadata"> | null | undefined): AppRole {
  if (!user) return DEFAULT_ROLE
  const rawRole =
    (user.user_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined) ??
    (user.user_metadata?.user_role as string | undefined)
  return isAppRole(rawRole) ? rawRole : DEFAULT_ROLE
}

export function getDefaultRouteForRole(role: AppRole): string {
  return ROLE_HOME[role]
}

export function isDashboardRouteAllowed(role: AppRole, pathname: string): boolean {
  const allowedPrefixes = DASHBOARD_ALLOWLIST[role]
  return allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function getLoginRouteForPath(pathname: string): string {
  if (pathname.startsWith("/dashboard/judges")) return "/judge-login"
  return "/login"
}

