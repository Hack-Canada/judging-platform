"use client";

import { useEffect, useMemo, useRef } from "react";

import type { EventAssignee } from "@/components/schedule/event-list-item";
import { formatEventTime } from "@/components/schedule/format-event-time";

export interface CalendarItem {
  id: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  description?: string;
  assignments?: EventAssignee[];
}

const HOUR_HEIGHT = 64;
const MIN_BLOCK_HEIGHT = 32;
const PX_PER_MINUTE = HOUR_HEIGHT / 60;
const VISIBLE_HOURS = 8;

function toDateKey(date: Date): string {
  return date.toDateString();
}

const dayHeadingFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const hourLabelFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric" });

interface PositionedItem extends CalendarItem {
  top: number;
  height: number;
  column: number;
  columns: number;
}

function layoutDay(items: CalendarItem[]): { items: PositionedItem[]; earliestStartHour: number } {
  const sorted = [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const columnEnds: number[] = [];
  const placed: { item: CalendarItem; column: number; startMin: number; endMin: number }[] = [];

  for (const item of sorted) {
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    const dayStart = new Date(start);
    dayStart.setHours(0, 0, 0, 0);

    const startMin = (start.getTime() - dayStart.getTime()) / 60000;
    let endMin = (end.getTime() - dayStart.getTime()) / 60000;
    if (endMin <= startMin) endMin = startMin + 30;
    endMin = Math.min(endMin, 24 * 60);

    let column = columnEnds.findIndex((endAt) => endAt <= startMin);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(endMin);
    } else {
      columnEnds[column] = endMin;
    }

    placed.push({ item, column, startMin, endMin });
  }

  const columns = Math.max(columnEnds.length, 1);
  const earliestStartHour = placed.length
    ? Math.min(...placed.map((p) => p.startMin)) / 60
    : 8;

  return {
    earliestStartHour,
    items: placed.map(({ item, column, startMin, endMin }) => ({
      ...item,
      top: startMin * PX_PER_MINUTE,
      height: Math.max((endMin - startMin) * PX_PER_MINUTE, MIN_BLOCK_HEIGHT),
      column,
      columns,
    })),
  };
}

const ALL_HOURS = Array.from({ length: 24 }, (_, hour) => hour);

function DayGrid({
  date,
  items,
  earliestStartHour,
}: {
  date: Date;
  items: PositionedItem[];
  earliestStartHour: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollToHour = Math.max(0, earliestStartHour - 1);
    el.scrollTop = scrollToHour * HOUR_HEIGHT;
  }, [earliestStartHour]);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-blue-700">{dayHeadingFormatter.format(date)}</h3>
      <div
        ref={scrollRef}
        className="overflow-y-auto rounded-md border bg-card"
        style={{ maxHeight: VISIBLE_HOURS * HOUR_HEIGHT }}
      >
        <div className="flex">
          <div className="flex flex-col">
            {ALL_HOURS.map((hour) => (
              <div
                key={hour}
                style={{ height: HOUR_HEIGHT }}
                className="w-14 shrink-0 -translate-y-2.5 pr-2 text-right text-xs text-foreground"
              >
                {hourLabelFormatter.format(new Date(2000, 0, 1, hour))}
              </div>
            ))}
          </div>
          <div className="relative flex-1 border-l" style={{ height: 24 * HOUR_HEIGHT }}>
            {ALL_HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute inset-x-0 border-t"
                style={{ top: hour * HOUR_HEIGHT }}
              />
            ))}
            {items.map((item) => (
              <div
                key={item.id}
                className="absolute overflow-hidden rounded-md border border-primary/30 bg-primary/10 p-1.5 text-xs text-foreground transition-colors hover:bg-primary/20"
                style={{
                  top: item.top,
                  height: item.height,
                  left: `calc(${(item.column / item.columns) * 100}% + 4px)`,
                  width: `calc(${100 / item.columns}% - 8px)`,
                }}
              >
                <p className="truncate font-medium">{item.title}</p>
                <p className="truncate">{formatEventTime(item.startTime, item.endTime)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventCalendar({ items }: { items: CalendarItem[] }) {
  const days = useMemo(() => {
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

    return [...map.entries()]
      .map(([key, dayItems]) => ({
        key,
        date: new Date(key),
        ...layoutDay(dayItems),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [items]);

  if (days.length === 0) {
    return <p className="text-sm text-muted-foreground">No events yet.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {days.map((day) => (
        <DayGrid
          key={day.key}
          date={day.date}
          items={day.items}
          earliestStartHour={day.earliestStartHour}
        />
      ))}
    </div>
  );
}
