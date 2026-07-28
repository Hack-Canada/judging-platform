"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarClock, FileText, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/stats", label: "Stats", icon: BarChart3 },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/admin/submissions", label: "Submissions", icon: FileText },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    // Horizontal-scroll row so the nav never overflows on phones.
    <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors [font-family:var(--font-figtree)]",
              active
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary-light)] hover:text-[var(--brand-secondary)]",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
      <Link
        href="/"
        className="ml-auto flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors [font-family:var(--font-figtree)] hover:bg-[var(--bg-primary-light)] hover:text-[var(--brand-secondary)]"
      >
        <Home className="size-4" />
        <span className="hidden sm:inline">Home</span>
      </Link>
    </nav>
  );
}
