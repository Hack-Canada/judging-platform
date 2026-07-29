"use client";

import type { Shift } from "@/app/volunteer/types";
import { useLiveShifts } from "@/app/volunteer/use-live-shifts";
import { ScheduleViewSwitcher } from "@/components/schedule/schedule-view-switcher";

export function LiveShiftSchedule({ initialShifts }: { initialShifts: Shift[] }) {
  const { shifts } = useLiveShifts(initialShifts);

  return (
    <ScheduleViewSwitcher
      items={shifts.map((shift) => ({
        id: shift.id,
        title: shift.title,
        location: shift.location,
        startTime: shift.startTime,
        endTime: shift.endTime,
        description: shift.description,
        assignments: [{ name: shift.teamLead || "You", role: shift.role }],
      }))}
    />
  );
}
