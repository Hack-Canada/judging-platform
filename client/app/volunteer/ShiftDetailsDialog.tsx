"use client";

import { Clock, MapPin, User } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Shift } from "@/app/volunteer/types";
import { formatShiftTime } from "@/app/volunteer/format-shift-time";

export function ShiftDetailsDialog({
  shift,
  open,
  onOpenChange,
}: {
  shift: Shift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[1.75rem] border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] sm:max-w-lg">
        {shift && (
          <>
            <DialogHeader>
              <DialogTitle className="[font-family:var(--font-fredoka)] text-lg font-semibold text-[var(--brand-secondary)]">
                {shift.title}
              </DialogTitle>
              <DialogDescription className="[font-family:var(--font-figtree)] text-[var(--text-secondary)]">
                {shift.role}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 [font-family:var(--font-figtree)] text-sm text-[var(--text-body)]">
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" strokeWidth={2} />
                {formatShiftTime(shift.startTime, shift.endTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" strokeWidth={2} />
                {shift.location}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="size-4" strokeWidth={2} />
                Team lead: {shift.teamLead}
              </span>
              <p className="mt-2 text-[var(--text-secondary)]">{shift.description}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
