"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  Location01Icon,
  User03Icon,
} from "@hugeicons/core-free-icons";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Shift } from "@/app/volunteer/data/shifts";
import { formatShiftTime } from "@/app/volunteer/components/format-shift-time";

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
      <DialogContent className="sm:max-w-lg">
        {shift && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">{shift.title}</DialogTitle>
              <DialogDescription>{shift.role}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 text-sm">
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={2} />
                {formatShiftTime(shift.startTime, shift.endTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Location01Icon} size={16} strokeWidth={2} />
                {shift.location}
              </span>
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={User03Icon} size={16} strokeWidth={2} />
                Team lead: {shift.teamLead}
              </span>
              <p className="mt-2 text-muted-foreground">{shift.description}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
