"use client";

import { useState } from "react";

import type { Shift } from "@/app/volunteer/data/shifts";
import { DashboardHeader } from "@/app/volunteer/components/dashboard-header";
import { CurrentShiftCard } from "@/app/volunteer/components/current-shift-card";
import { UpcomingShiftsList } from "@/app/volunteer/components/upcoming-shifts-list";
import { ShiftDetailsDialog } from "@/app/volunteer/components/shift-details-dialog";
import { ViewToggle, type ScheduleView } from "@/components/schedule/view-toggle";
import { EventCalendar } from "@/components/schedule/event-calendar";

export function VolunteerDashboard({ shifts }: { shifts: Shift[] }) {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [view, setView] = useState<ScheduleView>("list");

  const currentShift = shifts.find((shift) => shift.status === "current");
  const upcomingShifts = shifts.filter((shift) => shift.status === "upcoming");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DashboardHeader />
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted p-4">
        <div className="flex justify-end">
          <ViewToggle view={view} onChange={setView} />
        </div>
        {view === "list" ? (
          <>
            <CurrentShiftCard shift={currentShift} onSelect={setSelectedShift} />
            <UpcomingShiftsList shifts={upcomingShifts} onSelect={setSelectedShift} />
          </>
        ) : (
          <div className="mt-4">
            <EventCalendar
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
          </div>
        )}
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
