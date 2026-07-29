import { asc } from "drizzle-orm";

import { getDb } from "@/db/client";
import { hackerSchedule } from "@/db/schema";

import type { DaySchedule, ScheduleRow } from "./HackathonSchedule";

type MutableScheduleDay = {
  day: string;
  date: string;
  rows: Map<string, ScheduleRow>;
};

export async function getHackerSchedule(): Promise<DaySchedule[]> {
  const db = getDb();
  const records = await db
    .select({
      day: hackerSchedule.day,
      dateLabel: hackerSchedule.dateLabel,
      time: hackerSchedule.time,
      eventKey: hackerSchedule.eventKey,
      title: hackerSchedule.title,
      location: hackerSchedule.location,
      dayOrder: hackerSchedule.dayOrder,
      timeOrder: hackerSchedule.timeOrder,
    })
    .from(hackerSchedule)
    .orderBy(
      asc(hackerSchedule.dayOrder),
      asc(hackerSchedule.timeOrder),
      asc(hackerSchedule.eventKey),
    );

  const days = new Map<string, MutableScheduleDay>();

  for (const record of records) {
    const dayKey = `${record.dayOrder}:${record.day}:${record.dateLabel}`;
    let day = days.get(dayKey);

    if (!day) {
      day = {
        day: record.day,
        date: record.dateLabel,
        rows: new Map(),
      };
      days.set(dayKey, day);
    }

    let row = day.rows.get(record.time);
    if (!row) {
      row = {
        time: record.time,
        events: {},
      };
      day.rows.set(record.time, row);
    }

    row.events[record.eventKey] = {
      title: record.title,
      location: record.location,
    };
  }

  return Array.from(days.values()).map((day) => ({
    day: day.day,
    date: day.date,
    rows: Array.from(day.rows.values()),
  }));
}
