"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { getDefaultRouteForRole, getLoginRouteForPath, getUserRole, isDashboardRouteAllowed } from "@/lib/rbac"

export function DashboardAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [allowed, setAllowed] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelled) return

      if (!session?.user) {
        router.replace(getLoginRouteForPath(pathname))
        return
      }

      const role = getUserRole(session.user)
      if (!isDashboardRouteAllowed(role, pathname)) {
        router.replace(getDefaultRouteForRole(role))
        return
      }

      setAllowed(true)
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [pathname, router])

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking access...</p>
      </div>
    )
  }

  return <>{children}</>
}

