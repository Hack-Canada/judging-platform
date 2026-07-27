"use client";

import { useLiveSponsorSchedule } from "@/app/sponsor/use-live-schedule";
import { ScheduleViewSwitcher } from "@/components/schedule/schedule-view-switcher";
import type { ScheduleEvent } from "@/db/queries";

export function LiveSponsorSchedule({ initialEvents }: { initialEvents: ScheduleEvent[] }) {
  const { events } = useLiveSponsorSchedule(initialEvents);

  return (
    <ScheduleViewSwitcher
      items={events.map((event) => ({
        id: event.id,
        title: event.title,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        description: event.description,
        assignments: event.assignments,
      }))}
    />
  );
}
