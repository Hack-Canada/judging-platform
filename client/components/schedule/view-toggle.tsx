"use client";

import { CalendarDays, List, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ScheduleView = "list" | "calendar";

const options: { value: ScheduleView; icon: LucideIcon }[] = [
  { value: "list", icon: List },
  { value: "calendar", icon: CalendarDays },
];

export function ViewToggle({
  view,
  onChange,
}: {
  view: ScheduleView;
  onChange: (view: ScheduleView) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full px-4 [font-family:var(--font-figtree)] text-sm font-semibold capitalize transition-colors",
            view === option.value
              ? "bg-[var(--brand-secondary)] text-white"
              : "text-[var(--brand-primary)] hover:bg-[var(--bg-primary-light)]"
          )}
        >
          <option.icon className="size-4" strokeWidth={2} />
          {option.value}
        </button>
      ))}
    </div>
  );
}
