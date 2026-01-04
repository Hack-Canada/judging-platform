"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { IconLogout } from "@tabler/icons-react"
import { signOut } from "@/lib/auth-helpers"
import { toast } from "sonner"

const pageTitles: Record<string, string> = {
  "/dashboard": "Judges",
  "/dashboard/calendar": "Calendar",
  "/dashboard/admin": "Admin",
  "/dashboard/judges": "Judges View",
  "/dashboard/hackers": "Hackers Submission",
  "/dashboard/hacker-view": "Hacker View",
  "/dashboard/submissions": "Submissions",
  "/dashboard/roles": "Role Management",
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const title = pageTitles[pathname] || "Dashboard"

  const handleLogout = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        toast.error("Logout failed", {
          description: error.message,
        })
        return
      }
      toast.success("Logged out successfully")
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Logout failed", {
        description: "An unexpected error occurred",
      })
    }
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <IconLogout className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
