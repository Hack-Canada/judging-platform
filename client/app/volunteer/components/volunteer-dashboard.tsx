"use client";

import { useState } from "react";

import type { Shift } from "@/app/volunteer/data/shifts";
import { DashboardHeader } from "@/app/volunteer/components/dashboard-header";
import { CurrentShiftCard } from "@/app/volunteer/components/current-shift-card";
import { UpcomingShiftsList } from "@/app/volunteer/components/upcoming-shifts-list";
import { ShiftDetailsDialog } from "@/app/volunteer/components/shift-details-dialog";

export function VolunteerDashboard({ shifts }: { shifts: Shift[] }) {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const currentShift = shifts.find((shift) => shift.status === "current");
  const upcomingShifts = shifts.filter((shift) => shift.status === "upcoming");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DashboardHeader />
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 p-4">
        <CurrentShiftCard shift={currentShift} onSelect={setSelectedShift} />
        <UpcomingShiftsList shifts={upcomingShifts} onSelect={setSelectedShift} />
      </div>
      <ShiftDetailsDialog
        shift={selectedShift}
        open={selectedShift !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedShift(null);
        }}
      />
    </div>
  );
}
