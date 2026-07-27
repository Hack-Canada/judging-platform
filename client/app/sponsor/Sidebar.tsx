"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, type LucideIcon } from "lucide-react";

import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface SponsorNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const sponsorNavItems: SponsorNavItem[] = [
  { title: "Dashboard", url: "/sponsor", icon: LayoutDashboard },
  { title: "Schedule", url: "/sponsor/schedule", icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <SidebarPrimitive className="border-[color:var(--bg-gray-dark)]/55 bg-[var(--bg-light)]">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1 [font-family:var(--font-fredoka)] text-lg font-semibold tracking-[-0.02em] text-[var(--brand-secondary)]"
        >
          HackCanada
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {sponsorNavItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  className="[font-family:var(--font-figtree)] text-[var(--text-secondary)] data-active:bg-white data-active:text-[var(--brand-secondary)] data-active:shadow-[0_10px_24px_rgba(15,42,67,0.1)] hover:bg-white/55 hover:text-[var(--brand-secondary)]"
                >
                  <Link href={item.url}>
                    <item.icon className="size-[18px]" strokeWidth={1.9} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </SidebarPrimitive>
  );
}
