"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { dashboardEntries } from "@/lib/dashboard-entries-data"
import { supabase } from "@/lib/supabase-client"

export default function Page() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setHasAccess(true)
        } else {
          setHasAccess(false)
          router.push("/")
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    void checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setHasAccess(true)
      } else {
        setHasAccess(false)
        router.push("/")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return (
    <div suppressHydrationWarning className="relative">
      {/* Animated Grid Background */}
      <div className="animated-grid fixed inset-0 z-0" />
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
        <SidebarInset className="relative z-10">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
                </div> */}
                <DataTable data={dashboardEntries} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </div>
  )
}
