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
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-10 w-full max-w-md" />
            </div>

            <div className="space-y-5">
              <div className="space-y-2.5">
                <Skeleton className="h-5 w-44" />
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex flex-col gap-2 rounded-md border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <Skeleton className="h-5 w-40" />
                <div className="space-y-2">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="flex flex-col gap-2 rounded-md border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-28" />
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
