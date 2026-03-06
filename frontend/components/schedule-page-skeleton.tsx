"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type SchedulePageSkeletonProps = {
  embedded?: boolean
}

export function SchedulePageSkeleton({
  embedded = false,
}: SchedulePageSkeletonProps) {
  return (
    <div className={embedded ? "px-4 lg:px-6" : "min-h-screen bg-background p-4 md:p-8"}>
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-5 w-80 max-w-full" />
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2.5">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-11 w-full max-w-lg" />
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex flex-col gap-2 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-5 w-28" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-6 w-44" />
                <div className="space-y-2">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="flex flex-col gap-2 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <Skeleton className="h-6 w-44" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
