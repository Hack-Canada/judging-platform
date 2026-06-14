"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const phog = usePostHog()

  useEffect(() => {
    if (pathname && phog) {
      let url = window.origin + pathname
      if (searchParams.toString()) url += `?${searchParams.toString()}`
      phog.capture("$pageview", { $current_url: url })
    }
  }, [pathname, searchParams, phog])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false,  // handled manually via PostHogPageView for App Router
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: false,   // allow seeing form interactions in recordings
      },
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}
