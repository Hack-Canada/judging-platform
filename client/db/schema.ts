import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const eventStatusEnum = pgEnum("event_status", [
  "upcoming",
  "current",
  "completed",
]);

// Public hackathon program — what a hacker (or anyone) sees. Never has
// volunteer/sponsor assignment rows pointing at it.
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Public schedule cells rendered by /hacker/schedule. Repeated entries across
// adjacent time slots or columns are merged visually by HackathonSchedule.
export const hackerSchedule = pgTable(
  "hacker_schedule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    day: text("day").notNull(),
    dateLabel: text("date_label").notNull(),
    time: text("time").notNull(),
    eventKey: text("event_key").notNull(),
    title: text("title").notNull(),
    location: text("location").notNull().default(""),
    dayOrder: integer("day_order").notNull(),
    timeOrder: integer("time_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("hacker_schedule_day_time_event_unique").on(
      table.day,
      table.dateLabel,
      table.time,
      table.eventKey,
    ),
    index("hacker_schedule_display_order_idx").on(
      table.dayOrder,
      table.timeOrder,
      table.eventKey,
    ),
  ],
);

// Work items that get assigned to specific volunteers/sponsors (shifts,
// booth setup, etc.) via volunteer_assignments / sponsor_assignments.
export const schedule = pgTable("schedule", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  description: text("description").notNull().default(""),
  teamLead: text("team_lead"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const volunteers = pgTable("volunteers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sponsors = pgTable("sponsors", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const volunteerAssignments = pgTable(
  "volunteer_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),
    volunteerId: uuid("volunteer_id")
      .notNull()
      .references(() => volunteers.id, { onDelete: "cascade" }),
    role: text("role").notNull().default(""),
    status: eventStatusEnum("status").notNull().default("upcoming"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.scheduleId, t.volunteerId)]
);

export const sponsorAssignments = pgTable(
  "sponsor_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),
    sponsorId: uuid("sponsor_id")
      .notNull()
      .references(() => sponsors.id, { onDelete: "cascade" }),
    role: text("role").notNull().default(""),
    status: eventStatusEnum("status").notNull().default("upcoming"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.scheduleId, t.sponsorId)]
);
