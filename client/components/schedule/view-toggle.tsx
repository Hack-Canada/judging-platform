"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ListViewIcon, Calendar01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";

export type ScheduleView = "list" | "calendar";

const options: { value: ScheduleView; icon: typeof ListViewIcon }[] = [
  { value: "list", icon: ListViewIcon },
  { value: "calendar", icon: Calendar01Icon },
];

export function ViewToggle({
  view,
  onChange,
}: {
  view: ScheduleView;
  onChange: (view: ScheduleView) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border bg-muted p-1">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="default"
          variant={view === option.value ? "default" : "ghost"}
          className="capitalize"
          onClick={() => onChange(option.value)}
        >
          <HugeiconsIcon icon={option.icon} size={16} strokeWidth={2} />
          {option.value}
        </Button>
      ))}
    </div>
  );
}
