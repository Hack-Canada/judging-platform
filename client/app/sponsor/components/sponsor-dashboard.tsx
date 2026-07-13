"use client";

import { useState } from "react";

import { DashboardHeader } from "@/app/sponsor/components/dashboard-header";
import { EventListItem } from "@/components/schedule/event-list-item";
import { ViewToggle, type ScheduleView } from "@/components/schedule/view-toggle";
import { EventCalendar } from "@/components/schedule/event-calendar";
import type { ScheduleEvent } from "@/db/queries";

export function SponsorDashboard({ events }: { events: ScheduleEvent[] }) {
  const [view, setView] = useState<ScheduleView>("list");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DashboardHeader />
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-blue-700">Your Events</h2>
          <ViewToggle view={view} onChange={setView} />
        </div>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            You have no events assigned yet.
          </p>
        ) : view === "list" ? (
          <div className="mt-2 flex flex-col gap-2">
            {events.map((event) => (
              <EventListItem key={event.id} {...event} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EventCalendar items={events} />
          </div>
        )}
      </div>
    </div>
  );
}
