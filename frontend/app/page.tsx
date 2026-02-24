"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase-client"

export default function Home() {
  const [scheduleVisible, setScheduleVisible] = React.useState(false)

  React.useEffect(() => {
    const loadVisibility = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "hacker_schedule_visibility")
        .maybeSingle()
      setScheduleVisible(data?.setting_value === "enabled")
    }
    void loadVisibility()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6">
        <div>
          <h1 className="text-2xl font-bold">HackCanada Platform</h1>
          <p className="text-sm text-muted-foreground">Choose how you want to access the platform.</p>
        </div>
        <div className="space-y-3">
          <a href="/submit" className="block rounded-md border px-4 py-3 text-sm hover:bg-muted/40">
            Submission
          </a>
          {scheduleVisible ? (
            <a href="/schedule" className="block rounded-md border px-4 py-3 text-sm hover:bg-muted/40">
              Judging Schedule
            </a>
          ) : (
            <div
              aria-disabled="true"
              className="block cursor-not-allowed rounded-md border border-muted bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
            >
              Judging Schedule (Not Visible Yet)
            </div>
          )}
          <a href="/login" className="block rounded-md border px-4 py-3 text-sm hover:bg-muted/40">
            Admin
          </a>
          <a href="/judge-login" className="block rounded-md border px-4 py-3 text-sm hover:bg-muted/40">
            Judges
          </a>
        </div>
      </div>
    </div>
  )
}
