"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SchedulePageSkeleton } from "@/components/schedule-page-skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

function DashboardShellSkeleton({ children }: { children: React.ReactNode }) {
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
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-2 pb-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-4 self-end" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableSkeleton({
  columns,
  rows,
}: {
  columns: number
  rows: number
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 border-b pb-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-3 border-b pb-3 last:border-b-0"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={`h-4 ${columnIndex === 0 ? "w-28" : "w-20"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function TitleBlockSkeleton() {
  return (
    <div className="mb-6 space-y-2 px-4 lg:px-6">
      <Skeleton className="h-9 w-52" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  )
}

export function DashboardHomeSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="border-dashed">
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0 py-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShellSkeleton>
  )
}

export function DashboardAdminSkeleton() {
  return (
    <DashboardShellSkeleton>
      <TitleBlockSkeleton />
      <div className="px-4 lg:px-6">
        <StatCardsSkeleton />
      </div>
      <div className="space-y-6 px-4 lg:px-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              {index === 0 ? (
                <TableSkeleton columns={6} rows={5} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((__, itemIndex) => (
                    <div key={itemIndex} className="space-y-2 rounded-md border p-3">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShellSkeleton>
  )
}

export function DashboardJudgesSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="px-4 lg:px-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <StatCardsSkeleton count={3} />
            <TableSkeleton columns={4} rows={6} />
          </CardContent>
        </Card>
      </div>
    </DashboardShellSkeleton>
  )
}

export function DashboardSubmissionsSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <TableSkeleton columns={6} rows={7} />
          </CardContent>
        </Card>
      </div>
    </DashboardShellSkeleton>
  )
}

export function DashboardRolesSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="px-4 lg:px-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <Skeleton className="h-4 w-lg max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <TableSkeleton columns={5} rows={7} />
          </CardContent>
        </Card>
      </div>
    </DashboardShellSkeleton>
  )
}

export function DashboardCalendarSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="rounded-lg border p-4">
              <div className="grid gap-3 md:grid-cols-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-md" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShellSkeleton>
  )
}

export function DashboardHackerFormSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="px-4 lg:px-6">
        <SubmissionPageSkeleton embedded />
      </div>
    </DashboardShellSkeleton>
  )
}

export function DashboardHackerViewSkeleton() {
  return (
    <DashboardShellSkeleton>
      <SchedulePageSkeleton embedded />
    </DashboardShellSkeleton>
  )
}

export function SubmissionPageSkeleton({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={embedded ? "" : "min-h-screen bg-background p-4 md:p-8"}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <div className="grid gap-3 rounded-md border p-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function LandingPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function LoginPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export function DashboardRouteSkeleton({ pathname }: { pathname: string }) {
  if (pathname.startsWith("/dashboard/admin")) return <DashboardAdminSkeleton />
  if (pathname.startsWith("/dashboard/judges")) return <DashboardJudgesSkeleton />
  if (pathname.startsWith("/dashboard/submissions")) return <DashboardSubmissionsSkeleton />
  if (pathname.startsWith("/dashboard/roles")) return <DashboardRolesSkeleton />
  if (pathname.startsWith("/dashboard/calendar")) return <DashboardCalendarSkeleton />
  if (pathname.startsWith("/dashboard/hacker-view")) return <DashboardHackerViewSkeleton />
  if (pathname.startsWith("/dashboard/hackers")) return <DashboardHackerFormSkeleton />
  return <DashboardHomeSkeleton />
}

