"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconGavel,
  IconFolder,
  IconSettings,
  IconCalendar,
  IconUser,
  IconUsers,
  IconShield,
} from "@tabler/icons-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const shortcuts = [
  { title: "Judges", url: "/dashboard/judges", icon: IconGavel, description: "Judge dashboard and points" },
  { title: "Submissions", url: "/dashboard/submissions", icon: IconFolder, description: "View all project submissions" },
  { title: "Hackers Submission", url: "/dashboard/hackers", icon: IconUsers, description: "Submit a hackathon project" },
  { title: "Hacker View", url: "/dashboard/hacker-view", icon: IconUser, description: "View team judging timings" },
  { title: "Calendar", url: "/dashboard/calendar", icon: IconCalendar, description: "Schedule and room assignments" },
  { title: "Admin", url: "/dashboard/admin", icon: IconSettings, description: "Publish schedule and settings" },
  { title: "Role Management", url: "/dashboard/roles", icon: IconShield, description: "Manage user roles" },
]

export default function Page() {
  return (
    <div suppressHydrationWarning className="relative">
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
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dashboard</CardTitle>
                      <CardDescription>
                        Shortcuts to main sections
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {shortcuts.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link key={item.url} href={item.url}>
                              <Card className="transition-colors hover:bg-muted/50 cursor-pointer border-dashed">
                                <CardHeader className="flex flex-row items-center gap-3 space-y-0 py-4">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div className="space-y-1">
                                    <CardTitle className="text-base">{item.title}</CardTitle>
                                    <CardDescription className="text-xs">
                                      {item.description}
                                    </CardDescription>
                                  </div>
                                </CardHeader>
                              </Card>
                            </Link>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
