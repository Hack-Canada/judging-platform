"use client";

import { useMemo, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { EventListItem, type EventAssignee } from "@/components/schedule/event-list-item";

export interface CalendarItem {
  id: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  description?: string;
  assignments?: EventAssignee[];
}

function toDateKey(date: Date): string {
  return date.toDateString();
}

export function EventCalendar({ items }: { items: CalendarItem[] }) {
  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = toDateKey(new Date(item.startTime));
      const existing = map.get(key);
      if (existing) {
        existing.push(item);
      } else {
        map.set(key, [item]);
      }
    }
    return map;
  }, [items]);

  const datesWithItems = useMemo(
    () => [...itemsByDay.keys()].map((key) => new Date(key)),
    [itemsByDay]
  );

  const [selected, setSelected] = useState<Date | undefined>(
    datesWithItems[0]
  );

  const selectedItems = selected ? itemsByDay.get(toDateKey(selected)) ?? [] : [];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        modifiers={{ hasItems: datesWithItems }}
        modifiersClassNames={{
          hasItems: "font-semibold underline underline-offset-4",
        }}
        className="rounded-md border"
      />
      <div className="flex flex-1 flex-col gap-2">
        {selectedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events on this day.
          </p>
        ) : (
          selectedItems.map((item) => <EventListItem key={item.id} {...item} />)
        )}
      </div>
    </div>
  );
}
