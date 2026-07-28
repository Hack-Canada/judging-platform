"use client";

import { useEffect, useState } from "react";

import type { Shift } from "@/app/volunteer/types";
import { CurrentShiftCard } from "@/app/volunteer/CurrentShiftCard";
import { UpcomingShiftsList } from "@/app/volunteer/UpcomingShiftsList";
import { ShiftDetailsDialog } from "@/app/volunteer/ShiftDetailsDialog";
import { useLiveShifts } from "@/app/volunteer/use-live-shifts";
import { ViewToggle, type ScheduleView } from "@/components/schedule/view-toggle";
import { EventCalendar } from "@/components/schedule/event-calendar";

export function VolunteerDashboard({ shifts: initialShifts }: { shifts: Shift[] }) {
  const { shifts, lastSync } = useLiveShifts(initialShifts);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [view, setView] = useState<ScheduleView>("list");
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.max(0, Math.round((Date.now() - lastSync) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSync]);

  const currentShift = shifts.find((shift) => shift.status === "current");
  const upcomingShifts = shifts.filter((shift) => shift.status === "upcoming");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[color:var(--bg-gray-dark)]/55 bg-[var(--bg-white)] px-4 pb-5 pt-5 sm:px-6 sm:py-7">
        <h1 className="[font-family:var(--font-fredoka)] text-2xl font-semibold tracking-[-0.02em] text-[var(--brand-secondary)]">
          Volunteer Dashboard
        </h1>
        <p className="mt-1 [font-family:var(--font-figtree)] text-sm text-[var(--text-secondary)]">
          Your shifts for the event!
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--bg-gray)] px-4 py-5 sm:px-6 sm:py-7">
        <div className="mb-4 flex items-center justify-between">
          <span className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            Live · updated {secondsAgo}s ago
          </span>
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
