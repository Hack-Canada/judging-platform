"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/auth-helpers"
import { toast } from "sonner"
import { useSidebar } from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar?: string
    role?: string
  }
}) {
  const router = useRouter()
  const { state } = useSidebar()
  const [loading, setLoading] = React.useState(false)
  const isMinimized = state === "collapsed"

  const handleLogout = async () => {
    try {
      setLoading(true)
      const { error } = await signOut()
      if (error) {
        toast.error("Failed to logout", {
          description: error.message,
        })
        setLoading(false)
        return
      }
      
      // Logout successful - navigate to home page
      toast.success("Logged out successfully")
      
      // Use window.location for a full page reload to ensure clean state
      window.location.href = "/"
    } catch (error) {
      toast.error("Failed to logout", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
      setLoading(false)
    }
  }

  if (!user) return null

  const displayRole = user.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "User"

  return (
    <div
      className={cn(
        "origin-left p-3 transition-all duration-500 border-t",
        isMinimized ? "opacity-0 duration-100" : "opacity-100 delay-300",
      )}
    >
      <div className="flex gap-3.5 rounded-lg border bg-card p-3 shadow-sm">
        <div className="relative aspect-square size-9 shrink-0 overflow-hidden rounded-full border border-primary/20">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt="User avatar"
              className="object-cover bg-background"
              fill
              sizes="36px"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-medium text-muted-foreground">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 min-w-0">
          <div className="space-y-1">
            <p className="line-clamp-1 font-medium text-foreground text-sm">
              {user.name}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground/80">
              {user.email}
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary w-fit">
              {displayRole}
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="group flex w-full items-center justify-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="size-3" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
