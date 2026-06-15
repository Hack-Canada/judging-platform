# Onboarding Tasks - Mini Judging Platform

Hey! So before you dive into the actual codebase, we want you to build a mini version of the judging platform yourself. It's the same stack we're using, just smaller. Trust me it'll make way more sense once you've built something with it end to end.

You'll be building an app that pulls in hackathon project data, lets an admin assign judging slots to projects, and shows a public timetable of who's getting judged and when.

**Stack:** Next.js (App Router) · Tailwind CSS · Drizzle ORM · Neon (PostgreSQL)

## Quick heads up on auth

Don't worry about authentication at all for this. Every page including the admin panel is fully public. We'll add auth to the real thing later, for now just pretend everyone's trusted.

## AI usage

Please use AI, seriously. Use it to understand APIs you've never seen, generate boilerplate, debug weird errors, whatever helps. The only thing that matters is that you actually understand what the code is doing. If you couldn't explain it or rewrite it yourself, keep digging until you can.

## Getting started

```bash
git checkout onboarding
git checkout -b dev/<your-name>
cd frontend
npm install
```

## Task 1 - Environment Setup

Connect your app to your own Neon Postgres database. Each person gets their own free Neon project, don't share one.

1. Create a free account at [console.neon.tech](https://console.neon.tech)
2. Create a new project (any region is fine)
3. Go to Connection Details and copy the connection string from the `.env` tab
4. Copy `.env.example` to `.env.local` and paste your connection string in there
5. Test it by adding a quick `scripts/test-connection.ts` file:

```ts
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);
const result = await sql`SELECT NOW()`;
console.log(result);
```

Run it with `npx tsx scripts/test-connection.ts` and you should see a timestamp come back. Delete the file once it works, you don't need it anymore.

## Task 2 - Schema & Migration

Now define your database schema using Drizzle and push it up to Neon.

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

Once that's done, push it:

```bash
npm run db:push
```

You can verify the tables exist by running `npm run db:studio` and opening Drizzle Studio at `localhost:4983`.

**Docs:** [orm.drizzle.team/docs/sql-schema-declaration](https://orm.drizzle.team/docs/sql-schema-declaration)

## Task 3 - Import the DevPost Data

Time to populate your database. Open `scripts/import-devpost.ts` and write a script that reads the CSV at `../../data/mock_submissions.csv` and bulk inserts everything into your `submissions` table.

The CSV columns are `project_name, devpost_link, tracks, submitter_name, submitter_email, members`. A few things to know before you start:

- Row 1 is the header, skip it
- Some fields might be empty, just store an empty string
- Some fields have quoted values with commas inside them, so don't just split on commas blindly. Run `head -5 ../../data/mock_submissions.csv` first and look at what you're dealing with

Once you've parsed the rows, insert them all at once:

```ts
await db.insert(submissions).values(rows);
```

Then run it:

```bash
npm run import
```

Open `db:studio` afterwards and confirm you've got 20 rows in the submissions table.

**Docs:** [orm.drizzle.team/docs/insert](https://orm.drizzle.team/docs/insert)

## Task 4 - Public Schedule Page

Build a `/schedule` page that shows the judging timetable. This is a public page anyone can view.

Create `app/schedule/page.tsx` as a Server Component so you can query the database directly without needing an API route.

What to show:
- If nothing's been scheduled yet, just show a friendly empty state
- If there are slots, list them sorted by time. Each one should show the project name, room, start and end time formatted nicely (like "2:00 PM - 2:20 PM"), track badges, and team members

Style it with Tailwind, doesn't need to be fancy just readable.

Go to `localhost:3000/schedule` and make sure it loads. It'll be empty for now, that's fine. You'll come back after Task 5.

**Docs:** [nextjs.org/docs/app/building-your-application/data-fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)

## Task 5 - Admin Panel: Create Judging Slots

Build the `/admin` page where someone can assign time slots to projects.

Create `app/admin/page.tsx`. It needs two things:

**A list of all submissions** so the admin can see what's there. Show the project name and tracks.

**A form to schedule a slot** with:
- Start time
- End time
- Room (like "Room A" or "Table 3")
- Notes (optional)

When the form is submitted, wire it up to a Server Action in `app/admin/actions.ts` that:
1. Validates the input with Zod (all fields required except notes, end time must be after start time)
2. Inserts a row into `judging_slots`
3. Calls `revalidatePath("/schedule")` so the public page stays up to date

After submitting you should be able to go to `/schedule` and see the slot show up there.

**Docs:**
- Server Actions: [nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- Zod: [zod.dev](https://zod.dev)

## Task 6 - Admin Panel: Edit & Delete Slots

Extend `/admin` to show all the currently scheduled slots and let the admin edit or delete them.

For each slot, show the project name, time, and room with an Edit button and a Delete button. Edit should open a pre-filled form with the existing values. Delete should remove the slot (a simple `window.confirm` is fine for confirmation).

Both should be Server Actions that update or delete the row, then call `revalidatePath` on both `/schedule` and `/admin` so everything stays in sync.

Done when: editing a slot updates it on both pages, deleting removes it from both pages, and the public schedule always shows the latest without needing a refresh.

## Bonus stuff (if you finish early)

- **Track filter on `/schedule`** - let users filter by track like AI, Fintech, etc.
- **Conflict detection** - warn the admin if they're trying to book the same room at an overlapping time
- **Submission detail page** - `/submissions/[id]` with full project info and its scheduled slot
- **shadcn/ui** - swap out the raw HTML for proper components from [ui.shadcn.com](https://ui.shadcn.com)
- **Export to CSV** - a download button on `/admin` that exports the full timetable

## Useful commands

```bash
npm run dev          # Start the dev server at localhost:3000
npm run db:push      # Push schema changes to Neon
npm run db:studio    # Browse your DB in Drizzle Studio at localhost:4983
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
