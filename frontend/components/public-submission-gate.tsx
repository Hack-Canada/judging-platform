"use client"

import * as React from "react"
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

  React.useEffect(() => {
    let cancelled = false

    const loadVisibility = async () => {
      try {
        const { data } = await supabase
          .from("admin_settings")
          .select("setting_value")
          .eq("setting_key", "submission_form_visibility")
          .maybeSingle()

        if (cancelled) return
        setSubmissionFormEnabled(data?.setting_value !== "disabled")
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
            <p className="text-sm text-muted-foreground">
              Project submissions are currently closed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
