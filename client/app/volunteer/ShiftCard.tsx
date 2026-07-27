"use client";

import { Clock, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Shift } from "@/app/volunteer/types";
import { formatShiftTime } from "@/app/volunteer/format-shift-time";

export function ShiftCard({
  shift,
  current = false,
  onClick,
}: {
  shift: Shift;
  current?: boolean;
  onClick: (shift: Shift) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(shift)}
      className={cn(
        "flex w-full flex-col gap-2 rounded-2xl border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] p-4 text-left shadow-[0_10px_24px_rgba(15,42,67,0.06)] transition-colors hover:bg-[var(--bg-light)]",
        current && "ring-2 ring-[var(--brand-primary)]/50"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="[font-family:var(--font-fredoka)] text-base font-semibold tracking-[-0.01em] text-[var(--brand-secondary)]">
          {shift.title}
        </span>
        {current && (
          <Badge className="bg-[var(--brand-accent)] text-white">Now</Badge>
        )}
      </div>
      <div className="flex flex-col gap-1 [font-family:var(--font-figtree)] text-sm text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" strokeWidth={2} />
          {formatShiftTime(shift.startTime, shift.endTime)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-4" strokeWidth={2} />
          {shift.location}
        </span>
      </div>
    </button>
  );
}
