# Onboarding Tasks — Mini Judging Platform

Welcome to the team. Before you touch the main codebase, you're going to build a small but real version of the judging platform using the same stack we'll be using going forward.

**Stack:** Next.js (App Router) · Tailwind CSS · Drizzle ORM · Neon (PostgreSQL)

**What you'll build:** An app that imports real hackathon project data, lets an admin assign judging time slots to projects, and shows a public timetable of when each project is being judged.

---

## A note on AI usage

**AI is encouraged and expected.** Use it to understand unfamiliar APIs, generate boilerplate, debug errors, and speed up your work. What matters is that you understand what the code does — don't blindly paste output you can't explain. A good rule: if you couldn't re-write it from scratch after reading it, keep digging.

---

## Getting started

```bash
git checkout onboarding
git checkout -b dev/<your-name>
cd onboarding
npm install
```

---

## Task 1 — Environment Setup

**Goal:** Connect your app to your own Neon Postgres database.

**Steps:**
1. Create a free account at [console.neon.tech](https://console.neon.tech)
2. Create a new project (any region is fine)
3. Go to **Connection Details** → copy the connection string from the `.env` tab
4. Copy `.env.example` to `.env.local` and paste your connection string
5. Verify it works — add a temporary file `scripts/test-connection.ts` that runs a raw query:

```ts
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);
const result = await sql`SELECT NOW()`;
console.log(result);
```

Run it with: `npx tsx scripts/test-connection.ts`

**Acceptance criteria:** The script prints the current timestamp from your Neon database without errors. Delete the test file once it works.

---

## Task 2 — Schema & Migration

**Goal:** Define your database schema using Drizzle and push it to Neon.

Open `db/schema.ts`. You'll see comments explaining what to build. Define two tables:

**`submissions`** — the hackathon projects
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key, auto-generated |
| project_name | varchar(255) | not null |
| devpost_link | varchar(512) | not null |
| tracks | text | pipe-separated string, e.g. `"AI\|Fintech"` |
| submitter_name | varchar(255) | not null |
| submitter_email | varchar(255) | not null |
| members | text | pipe-separated string, e.g. `"Alice\|Bob"` |
| created_at | timestamp | defaults to now() |

**`judging_slots`** — admin-managed timetable entries
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key, auto-generated |
| submission_id | uuid | foreign key → submissions.id (cascade delete) |
| start_time | timestamp | not null |
| end_time | timestamp | not null |
| room | varchar(100) | not null, e.g. `"Room A"`, `"Table 3"` |
| notes | text | optional |
| created_at | timestamp | defaults to now() |

Once your schema is defined, push it to your database:

```bash
npm run db:push
```

**Acceptance criteria:** Running `npm run db:push` completes without errors. You can verify your tables exist by running `npm run db:studio` and checking the Drizzle Studio UI at `localhost:4983`.

**Docs:** [orm.drizzle.team/docs/sql-schema-declaration](https://orm.drizzle.team/docs/sql-schema-declaration)

---

## Task 3 — Import the DevPost Data

**Goal:** Populate your `submissions` table with all 208 real hackathon projects.

Open `scripts/import-devpost.ts`. The CSV is at `../../data/final_clean_with_general.csv` relative to this file.

The CSV columns are: `project_name, devpost_link, tracks, submitter_name, submitter_email, members`

A few things to watch out for:
- The first row is a header — skip it
- Some fields may be empty (e.g. no tracks assigned) — that's fine, store an empty string
- The CSV has quoted fields that may contain commas — look at the raw file first before you write your parser: `head -5 ../../data/final_clean_with_general.csv`

Use Drizzle's insert API to bulk-insert all rows:

```ts
await db.insert(submissions).values(rows);
```

Run your script:

```bash
npm run import
```

**Acceptance criteria:** The script runs without errors and logs a count. Open `db:studio` and confirm you see ~208 rows in the `submissions` table.

**Docs:** [orm.drizzle.team/docs/insert](https://orm.drizzle.team/docs/insert)

---

## Task 4 — Public Schedule Page

**Goal:** Build a `/schedule` page that shows the current judging timetable.

Create `app/schedule/page.tsx`. This should be a **Server Component** — fetch data directly from the database, no API route needed.

What to display:
- If no slots have been created yet: a friendly empty state ("No judging slots scheduled yet.")
- If slots exist: list them grouped by time or sorted chronologically. Each slot should show:
  - Project name
  - Room
  - Start and end time (formatted readably, e.g. `"2:00 PM – 2:20 PM"`)
  - Tracks (split the pipe-separated string into badges/tags)
  - Team members (split the pipe-separated string)

Style it with Tailwind. It doesn't need to be fancy — clean and readable is enough.

**Acceptance criteria:** `localhost:3000/schedule` loads without error. It shows an empty state (since no slots exist yet). After Task 5 creates some slots, come back and verify they appear here.

**Docs:** [nextjs.org/docs/app/building-your-application/data-fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)

---

## Task 5 — Admin Panel: Create Judging Slots

**Goal:** Build an `/admin` page where an admin can assign a judging slot to any project.

Create `app/admin/page.tsx`. This page has two parts:

**Part A — Submission list**
- Fetch all submissions from the DB
- Display them in a searchable or scrollable list (project name + track)
- Each row has a "Schedule" button or form that expands inline

**Part B — Schedule form**
When the admin clicks "Schedule" on a project, show a form with:
- Start time (datetime input)
- End time (datetime input)
- Room (text input, e.g. "Room A")
- Notes (optional textarea)

On submit, the form calls a **Server Action** that:
1. Validates the input with Zod (start_time required, end_time required, room required, end_time must be after start_time)
2. Inserts a new row into `judging_slots`
3. Calls `revalidatePath("/schedule")` so the public page updates
4. Shows a success toast (install `sonner` and use `toast.success(...)`)

**Acceptance criteria:** You can pick a project, fill in a time and room, submit the form, and then see the slot appear on `/schedule`.

**Docs:**
- Server Actions: [nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- Zod: [zod.dev](https://zod.dev)
- Sonner: [sonner.emilkowal.ski](https://sonner.emilkowal.ski)

---

## Task 6 — Admin Panel: Edit & Delete Slots

**Goal:** Let the admin edit or delete existing judging slots.

Extend your `/admin` page to also show all currently scheduled slots.

For each slot:
- Show the project name, time, and room
- Add an **Edit** button that opens the slot's details in a form (pre-filled with current values)
- Add a **Delete** button with a confirmation prompt (`window.confirm` is fine)

Both actions should be Server Actions that update or delete the row in `judging_slots`, then call `revalidatePath("/schedule")` and `revalidatePath("/admin")`.

**Acceptance criteria:**
- Editing a slot updates the time/room on both `/admin` and `/schedule`
- Deleting a slot removes it from both pages
- The public `/schedule` always reflects the current state without a manual refresh

---

## Bonus — Polish

If you finish early, pick any of these:

- **Track filter on `/schedule`** — let users filter the timetable by track (AI, Fintech, etc.)
- **Conflict detection** — warn the admin if they try to assign the same room at an overlapping time
- **Submission detail page** — `/submissions/[id]` showing full project info + its scheduled slot
- **shadcn/ui** — install [ui.shadcn.com](https://ui.shadcn.com) and replace raw HTML elements with proper components (Card, Button, Badge, Table, Dialog)
- **Export to CSV** — a button on `/admin` that downloads the full timetable as a CSV

---

## Reference: Useful commands

```bash
npm run dev          # Start the dev server at localhost:3000
npm run db:push      # Push your schema to Neon (run after schema changes)
npm run db:studio    # Open Drizzle Studio to browse your DB at localhost:4983
npm run import       # Run your DevPost import script
npx tsx <file.ts>    # Run any TypeScript file directly
```

## Reference: Key docs

| Topic | Link |
|---|---|
| Drizzle schema | https://orm.drizzle.team/docs/sql-schema-declaration |
| Drizzle queries | https://orm.drizzle.team/docs/select |
| Drizzle insert | https://orm.drizzle.team/docs/insert |
| Neon serverless | https://neon.tech/docs/serverless/serverless-driver |
| Next.js Server Components | https://nextjs.org/docs/app/building-your-application/rendering/server-components |
| Next.js Server Actions | https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations |
| Tailwind CSS | https://tailwindcss.com/docs |
| Zod | https://zod.dev |
