"use client"

import { HackerSubmissionForm } from "@/components/hacker-submission-form"

type PublicSubmissionGateProps = {
  embedded?: boolean
  showScheduleInlineWhenClosed?: boolean
}

export function PublicSubmissionGate({
  embedded = false,
}: PublicSubmissionGateProps) {
  return <HackerSubmissionForm embedded={embedded} />
}
