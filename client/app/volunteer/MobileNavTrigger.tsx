"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function MobileNavTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleSidebar}
      aria-label="Open navigation"
      className="text-[var(--brand-secondary)] hover:bg-[var(--bg-primary-light)]"
    >
      <Menu className="size-5" strokeWidth={2} />
    </Button>
  );
}
