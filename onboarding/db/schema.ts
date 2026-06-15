// ============================================================
// TASK 2: Define your database schema here using Drizzle ORM
// ============================================================
//
// You need two tables:
//
// 1. `submissions` — the hackathon projects (imported from the DevPost CSV)
//    Columns: id, project_name, devpost_link, tracks, submitter_name,
//             submitter_email, members, created_at
//
//    Note: `tracks` and `members` are pipe-separated strings in the CSV
//    (e.g. "AI|Fintech"). Store them as plain text — you can split on "|"
//    in the UI when you need to display them as a list.
//
// 2. `judging_slots` — time slots assigned by the admin
//    Columns: id, submission_id (FK → submissions), start_time, end_time,
//             room, notes, created_at
//
// Useful Drizzle imports from "drizzle-orm/pg-core":
//   pgTable, uuid, varchar, text, timestamp
//
// Primary key pattern:
//   id: uuid("id").primaryKey().defaultRandom()
//
// Foreign key pattern:
//   submissionId: uuid("submission_id")
//     .notNull()
//     .references(() => submissions.id, { onDelete: "cascade" }),
//
// Docs: https://orm.drizzle.team/docs/sql-schema-declaration
// ============================================================

import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

// TODO: Define the submissions table

// TODO: Define the judging_slots table
