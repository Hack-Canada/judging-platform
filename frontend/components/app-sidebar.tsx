"use client"

import * as React from "react"
import Image from "next/image"
import {
  IconGavel,
  IconFolder,
  IconSettings,
  IconCalendar,
  IconUser,
  IconUsers,
  IconShield,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase-client"

const data = {
  navMain: [
    {
      title: "Judges View",
      url: "/dashboard/judges",
      icon: IconGavel,
    },
    {
      title: "Hackers Submission",
      url: "/dashboard/hackers",
      icon: IconUsers,
    },
    {
      title: "Hacker View",
      url: "/dashboard/hacker-view",
      icon: IconUser,
    },
    {
      title: "Submissions",
      url: "/dashboard/submissions",
      icon: IconFolder,
    },
    {
      title: "Calendar",
      url: "/dashboard/calendar",
      icon: IconCalendar,
    },
    {
      title: "Admin",
      url: "/dashboard/admin",
      icon: IconSettings,
    },
    {
      title: "Role Management",
      url: "/dashboard/roles",
      icon: IconShield,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar?: string
    role?: string
  } | null>(null)

  const loadUser = React.useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const userMetadata = session.user.user_metadata
        const appMetadata = session.user.app_metadata
        setUser({
          name: userMetadata?.name || userMetadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatar: userMetadata?.avatar_url || userMetadata?.picture,
          role: userMetadata?.role || appMetadata?.role || userMetadata?.user_role || "User",
        })
      }
    } catch (error) {
      // Error loading user
    }
  }, [])

  React.useEffect(() => {
    void loadUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userMetadata = session.user.user_metadata
        const appMetadata = session.user.app_metadata
        setUser({
          name: userMetadata?.name || userMetadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatar: userMetadata?.avatar_url || userMetadata?.picture,
          role: userMetadata?.role || appMetadata?.role || userMetadata?.user_role || "User",
        })
      } else {
        setUser(null)
      }
    })

    // Listen for custom role update events
    const handleRoleUpdate = async () => {
      // Refresh session to get updated metadata
      await supabase.auth.refreshSession()
      // Reload user data
      await loadUser()
    }

    window.addEventListener('userRoleUpdated', handleRoleUpdate)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('userRoleUpdated', handleRoleUpdate)
    }
  }, [loadUser])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[slot=sidebar-menu-button]:!p-3"
            >
              <a href="#" className="flex items-center gap-2">
                <Image
                  src="/hackcanada-logo.svg"
                  alt="HackCanada Logo"
                  width={24}
                  height={24}
                  className="flex-shrink-0"
                />
                <span className="text-base font-semibold">HackCanada 2026</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      {user && (
        <SidebarFooter className="p-0">
          <NavUser user={user} />
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
