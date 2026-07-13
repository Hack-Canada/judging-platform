"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, Location01Icon } from "@hugeicons/core-free-icons";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Shift } from "@/app/volunteer/data/shifts";
import { formatShiftTime } from "@/app/volunteer/components/format-shift-time";

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
    <Card
      size="sm"
      className={cn(
        "cursor-pointer rounded-md border border-foreground/15 bg-card shadow-sm transition-colors hover:bg-muted/50",
        current && "ring-primary/40"
      )}
      onClick={() => onClick(shift)}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{shift.title}</CardTitle>
          {current && <Badge>Now</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={2} />
          {formatShiftTime(shift.startTime, shift.endTime)}
        </span>
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Location01Icon} size={16} strokeWidth={2} />
          {shift.location}
        </span>
      </CardContent>
    </Card>
  );
}
