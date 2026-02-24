"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HackersDashboardRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/submit")
  }, [router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirecting to submission page...</p>
    </div>
  )
}

