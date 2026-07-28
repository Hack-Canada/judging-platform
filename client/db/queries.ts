import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  events,
  schedule,
  sponsorAssignments,
  sponsors,
  volunteerAssignments,
  volunteers,
  type eventStatusEnum,
} from "@/db/schema";
import type { Shift } from "@/app/volunteer/types";

// Placeholders until real auth/sessions exist — these point at seeded rows
// (see scripts/seed.mjs) and stand in for "the logged-in volunteer/sponsor."
const DEMO_VOLUNTEER_EMAIL = "priya.nair@hackcanada.dev";
const DEMO_SPONSOR_EMAIL = "alexa.reyes@northwindlabs.com";

export type EventStatus = (typeof eventStatusEnum.enumValues)[number];

export interface EventAssignee {
  name: string;
  role: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  description: string;
  teamLead: string;
  assignments: EventAssignee[];
}

export async function getVolunteerShifts(volunteerId?: string): Promise<Shift[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: volunteerAssignments.id,
      title: schedule.title,
      role: volunteerAssignments.role,
      location: schedule.location,
      teamLead: schedule.teamLead,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      description: schedule.description,
      status: volunteerAssignments.status,
    })
    .from(volunteerAssignments)
    .innerJoin(schedule, eq(volunteerAssignments.scheduleId, schedule.id))
    .where(
      volunteerId ? eq(volunteerAssignments.volunteerId, volunteerId) : undefined
    )
    .orderBy(schedule.startTime);

  return rows.map((row) => ({
    ...row,
    teamLead: row.teamLead ?? "",
    startTime: row.startTime.toISOString(),
    endTime: row.endTime.toISOString(),
  }));
}

/** Demo stand-in for "the logged-in volunteer's own shifts." */
export async function getDemoVolunteerShifts(): Promise<Shift[]> {
  const db = getDb();
  const [volunteer] = await db
    .select({ id: volunteers.id })
    .from(volunteers)
    .where(eq(volunteers.email, DEMO_VOLUNTEER_EMAIL));

  return getVolunteerShifts(volunteer?.id);
}

/** The public hackathon program — visible to every portal, no assignments. */
export async function getPublicEvents(): Promise<ScheduleEvent[]> {
  const db = getDb();
  const rows = await db.select().from(events).orderBy(events.startTime);

  return rows.map((event) => ({
    id: event.id,
    title: event.title,
    location: event.location,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    description: event.description,
    teamLead: "",
    assignments: [],
  }));
}

async function getSponsorOwnItems(sponsorId?: string): Promise<ScheduleEvent[]> {
  const db = getDb();

  const scheduleRows = await db.select().from(schedule);
  const scheduleIds = scheduleRows.map((row) => row.id);

  const assignmentRows = scheduleIds.length
    ? await db
        .select({
          scheduleId: sponsorAssignments.scheduleId,
          sponsorId: sponsorAssignments.sponsorId,
          name: sponsors.companyName,
          role: sponsorAssignments.role,
        })
        .from(sponsorAssignments)
        .innerJoin(sponsors, eq(sponsorAssignments.sponsorId, sponsors.id))
        .where(
          sponsorId
            ? eq(sponsorAssignments.sponsorId, sponsorId)
            : inArray(sponsorAssignments.scheduleId, scheduleIds)
        )
    : [];

  const assignmentsBySchedule = new Map<string, EventAssignee[]>();
  for (const row of assignmentRows) {
    const assignee = { name: row.name, role: row.role };
    const existing = assignmentsBySchedule.get(row.scheduleId);
    if (existing) {
      existing.push(assignee);
    } else {
      assignmentsBySchedule.set(row.scheduleId, [assignee]);
    }
  }

  return scheduleRows
    .filter((row) => assignmentsBySchedule.has(row.id))
    .map((row) => ({
      id: row.id,
      title: row.title,
      location: row.location,
      startTime: row.startTime.toISOString(),
      endTime: row.endTime.toISOString(),
      description: row.description,
      teamLead: row.teamLead ?? "",
      assignments: assignmentsBySchedule.get(row.id) ?? [],
    }));
}

/** Public program + a sponsor's own booth/schedule items, merged and sorted. */
export async function getSponsorSchedule(sponsorId?: string): Promise<ScheduleEvent[]> {
  const [publicEvents, sponsorItems] = await Promise.all([
    getPublicEvents(),
    getSponsorOwnItems(sponsorId),
  ]);

  return [...publicEvents, ...sponsorItems].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
}

async function getDemoSponsorId(): Promise<string | undefined> {
  const db = getDb();
  const [sponsor] = await db
    .select({ id: sponsors.id })
    .from(sponsors)
    .where(eq(sponsors.contactEmail, DEMO_SPONSOR_EMAIL));

  return sponsor?.id;
}

/** Demo stand-in for "the logged-in sponsor's" full schedule (public + their own). */
export async function getDemoSponsorSchedule(): Promise<ScheduleEvent[]> {
  return getSponsorSchedule(await getDemoSponsorId());
}

/** Demo stand-in for "the logged-in sponsor's" own items only (dashboard). */
export async function getDemoSponsorAssignments(): Promise<ScheduleEvent[]> {
  return getSponsorOwnItems(await getDemoSponsorId());
}
