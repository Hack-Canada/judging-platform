"use client";

import { useState } from "react";

import { ViewToggle, type ScheduleView } from "@/components/schedule/view-toggle";
import { EventCalendar, type CalendarItem } from "@/components/schedule/event-calendar";
import { EventListItem } from "@/components/schedule/event-list-item";

export function ScheduleViewSwitcher({ items }: { items: CalendarItem[] }) {
  const [view, setView] = useState<ScheduleView>("list");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ViewToggle view={view} onChange={setView} />
      </div>
      {view === "list" ? (
        items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <EventListItem key={item.id} {...item} />
            ))}
          </div>
        )
      ) : (
        <EventCalendar items={items} />
      )}
    </div>
  );
}
