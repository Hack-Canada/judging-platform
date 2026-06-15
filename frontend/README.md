# Onboarding Tasks - Mini Judging Platform

Before jumping into the main codebase, you'll be building a small but complete version of the judging platform using the same stack. The goal is to get comfortable with the tools end to end before working on the real thing.

You'll build an app that imports hackathon project data, lets an admin assign judging time slots to projects, and shows a public timetable of when each project is being judged.

**Stack:** Next.js (App Router) · Tailwind CSS · Drizzle ORM · Neon (PostgreSQL)

## A note on auth

No authentication is required for any of this. All pages including the admin panel are fully public. 

## Getting started

```bash
git checkout onboarding
git checkout -b dev/<your-name>
cd frontend
npm install
```

## Task 1 - Environment Setup

Connect your app to your own Neon Postgres database. Each developer gets their own free Neon project.

1. Create a free account at [console.neon.tech](https://console.neon.tech)
2. Create a new project (any region works)
3. Go to Connection Details and copy the connection string from the `.env` tab
4. Copy `.env.example` to `.env.local` and paste your connection string
5. Verify the connection by creating `scripts/test-connection.ts`:

```ts
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);
const result = await sql`SELECT NOW()`;
console.log(result);
```

Run it with `npx tsx scripts/test-connection.ts`. You should see a timestamp returned from your database. Delete the file once it's working.

## Task 2 - Schema & Migration

Define your database schema using Drizzle and push it to Neon.

Open `db/schema.ts` and define these two tables:

**`submissions`** - the hackathon projects
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

**`judging_slots`** - the timetable entries
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key, auto-generated |
| submission_id | uuid | foreign key to submissions.id (cascade delete) |
| start_time | timestamp | not null |
| end_time | timestamp | not null |
| room | varchar(100) | not null, e.g. `"Room A"` |
| notes | text | optional |
| created_at | timestamp | defaults to now() |

Push the schema to your database:

```bash
npm run db:push
```

Verify the tables were created by running `npm run db:studio` and opening Drizzle Studio at `localhost:4983`.

**Docs:** [orm.drizzle.team/docs/sql-schema-declaration](https://orm.drizzle.team/docs/sql-schema-declaration)

## Task 3 - Import the DevPost Data

Populate your `submissions` table by writing an import script that reads the CSV at `../../data/mock_submissions.csv` and bulk inserts all rows.

The CSV columns are `project_name, devpost_link, tracks, submitter_name, submitter_email, members`. A few things to keep in mind:

- Row 1 is the header, skip it
- Some fields may be empty, store an empty string for those
- Some fields contain quoted values with commas inside them, so don't split naively on commas. Run `head -5 ../../data/mock_submissions.csv` to inspect the format first

Once your rows are parsed, insert them all at once:

```ts
await db.insert(submissions).values(rows);
```

Run the script:

```bash
npm run import
```

Open `db:studio` and confirm you have 20 rows in the submissions table.

**Docs:** [orm.drizzle.team/docs/insert](https://orm.drizzle.team/docs/insert)

## Task 4 - Public Schedule Page

Build a `/schedule` page that displays the judging timetable. This is a public-facing page.

Create `app/schedule/page.tsx` as a Server Component so you can query the database directly without an API route.

The page should show:
- A friendly empty state if no slots have been scheduled yet
- A chronological list of slots if they exist, each showing the project name, room, formatted start and end time (e.g. "2:00 PM - 2:20 PM"), track badges, and team members

Style it with Tailwind. It doesn't need to be elaborate, just clear and readable.

Confirm `localhost:3000/schedule` loads without errors. It will show an empty state for now — you'll come back to verify it after Task 5.

**Docs:** [nextjs.org/docs/app/building-your-application/data-fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)

## Task 5 - Admin Panel: Create Judging Slots

Build an `/admin` page where an admin can assign judging slots to projects.

Create `app/admin/page.tsx` with two sections:

**Submission list** - fetch and display all submissions with project name and tracks.

**Schedule form** - a form with the following fields:
- Project (select from submissions)
- Start time
- End time
- Room (e.g. "Room A", "Table 3")
- Notes (optional)

On submit, the form should call a Server Action in `app/admin/actions.ts` that:
1. Validates the input with Zod (all fields required except notes, end time must be after start time)
2. Inserts a new row into `judging_slots`
3. Calls `revalidatePath("/schedule")` to keep the public page in sync

After submitting, navigate to `/schedule` and confirm the slot appears there.

**Docs:**
- Server Actions: [nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- Zod: [zod.dev](https://zod.dev)

## Task 6 - Admin Panel: Edit & Delete Slots

Extend `/admin` to list all existing judging slots with the ability to edit or delete each one.

For each slot, display the project name, time, and room alongside an Edit button and a Delete button. Edit should open a pre-filled form with the current values. Delete should remove the slot (a `window.confirm` prompt is fine).

Both operations should be Server Actions that update or delete the row in `judging_slots`, then call `revalidatePath` on both `/schedule` and `/admin`.

This task is complete when:
- Editing a slot updates it on both `/admin` and `/schedule`
- Deleting a slot removes it from both pages
- The public schedule reflects changes without a manual refresh

## Bonus (if you have time)

- **Track filter on `/schedule`** - let users filter the timetable by track
- **Conflict detection** - warn the admin if a room is already booked at an overlapping time
- **Submission detail page** - `/submissions/[id]` showing full project info and its scheduled slot
- **shadcn/ui** - replace raw HTML elements with components from [ui.shadcn.com](https://ui.shadcn.com)
- **Export to CSV** - a download button on `/admin` that exports the full timetable

## Useful commands

```bash
npm run dev          # Start the dev server at localhost:3000
npm run db:push      # Push schema changes to Neon
npm run db:studio    # Browse your database in Drizzle Studio at localhost:4983
npm run import       # Run the DevPost import script
npx tsx <file.ts>    # Run any TypeScript file directly
```

## Key docs

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
