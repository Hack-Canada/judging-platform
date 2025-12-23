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
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
    </Sidebar>
  )
}
