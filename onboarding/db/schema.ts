import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  devpostLink: varchar("devpost_link", { length: 512 }).notNull(),
  tracks: text("tracks"),
  submitterName: varchar("submitter_name", { length: 255 }).notNull(),
  submitterEmail: varchar("submitter_email", { length: 255 }).notNull(),
  members: text("members"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const judgingSlots = pgTable("judging_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  room: varchar("room", { length: 100 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type JudgingSlot = typeof judgingSlots.$inferSelect;
export type SlotWithSubmission = {
  slot: JudgingSlot;
  submission: Submission | null;
};
