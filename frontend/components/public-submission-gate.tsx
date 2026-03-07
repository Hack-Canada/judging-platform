"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HackerSubmissionForm } from "@/components/hacker-submission-form"
import { SubmissionPageSkeleton } from "@/components/page-skeletons"
import { supabase } from "@/lib/supabase-client"

type PublicSubmissionGateProps = {
  embedded?: boolean
}

export function PublicSubmissionGate({ embedded = false }: PublicSubmissionGateProps) {
  const [loading, setLoading] = React.useState(true)
  const [submissionFormEnabled, setSubmissionFormEnabled] = React.useState(true)
  const [scheduleVisible, setScheduleVisible] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    const loadVisibility = async () => {
      try {
        const { data } = await supabase
          .from("admin_settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["submission_form_visibility", "hacker_schedule_visibility"])

        if (cancelled) return
        const settingsMap = new Map((data || []).map((row) => [row.setting_key, row.setting_value]))
        setSubmissionFormEnabled(settingsMap.get("submission_form_visibility") !== "disabled")
        setScheduleVisible(settingsMap.get("hacker_schedule_visibility") === "enabled")
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadVisibility()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <SubmissionPageSkeleton embedded={embedded} />
  }

  return submissionFormEnabled ? (
    <HackerSubmissionForm embedded={embedded} />
  ) : (
    <div className={embedded ? "p-4 md:p-6" : "min-h-screen bg-background p-4 md:p-8"}>
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Not open - check again</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Project submissions are currently closed.
              </p>
              {scheduleVisible ? (
                <a href="/schedule">
                  <Button variant="outline">View Judging Schedule</Button>
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Check again later.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
