# Judge Portal (`/judging`) — Full Work Log

**Author:** Aly  
**Branch:** `aly/judging` (off `development`)  
**Route:** `/judging`  
**App location:** `client/` (not `frontend/` — the old onboarding app is deprecated for this work)

This document records **everything** done to build the HackCanada judge desk: setup, code, design iterations, files created, files removed, configuration, and what is still outstanding.

---

## Table of contents

1. [Assignment context](#assignment-context)
2. [Git & branch setup](#git--branch-setup)
3. [How to run locally](#how-to-run-locally)
4. [Environment & database](#environment--database)
5. [Architecture overview](#architecture-overview)
6. [Every file created or modified](#every-file-created-or-modified)
7. [Design evolution (all iterations)](#design-evolution-all-iterations)
8. [Current UI — what judges see](#current-ui--what-judges-see)
9. [Component reference](#component-reference)
10. [Data layer](#data-layer)
11. [Types & constants](#types--constants)
12. [CSS design system](#css-design-system)
13. [Shared app changes](#shared-app-changes)
14. [Frontend design skill](#frontend-design-skill)
15. [Files removed during development](#files-removed-during-development)
16. [What is NOT done yet](#what-is-not-done-yet)
17. [Team integration notes](#team-integration-notes)
18. [Git status (as of last session)](#git-status-as-of-last-session)

---

## Assignment context

From the team brief:

| Item | Value |
|------|-------|
| **Owner** | Aly |
| **Portal** | Judge (`/judging`) |
| **Branch name** | `aly/judging` |
| **Base branch** | `development` |
| **Stack** | Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Neon PostgreSQL |
| **Due** | Rough draft — Sunday July 5 (end of day) |

The judge portal is for **in-person** hackathon judging: judges walk between tables/rooms, view their schedule, see project details, take notes, and mark projects as judged. It is **not** a virtual-investment or money-allocation UI (that was briefly built based on the root README, then removed per feedback).

---

## Git & branch setup

1. Fetched `origin/development` — the new monorepo app lives in `client/`.
2. Checked out `development` and pulled latest.
3. Created branch `aly/judging`.
4. Renamed the old local `aly` branch to `aly-onboarding-old` (Git cannot have both `aly` and `aly/judging` as branch names).
5. Stashed an unrelated change on the old `frontend/app/layout.tsx` (`suppressHydrationWarning` for Grammarly hydration).

**Note:** Work on `aly/judging` was **not committed or pushed** during the build sessions. See [Git status](#git-status-as-of-last-session).

---

## How to run locally

```bash
cd client
npm install
```

Create `client/.env.local`:

```env
DATABASE_URL=postgresql://...your Neon connection string...
```

```bash
npm run dev
```

Open **http://localhost:3000/judging**

Or from the home page: **http://localhost:3000** → click **Judging**.

Production build verified with:

```bash
npm run build
```

---

## Environment & database

| File | Purpose |
|------|---------|
| `client/.env.local` | Neon `DATABASE_URL` (gitignored) |
| `client/.env.example` | Template from `development` branch |

**Connection behavior:**

- If `DATABASE_URL` is missing → uses **mock data** (`lib/judging/mock-data.ts`). UI shows a **preview** label in the header.
- If `DATABASE_URL` is set → queries `public.projects` table.
- If query fails or table is empty → falls back to mock data.
- `/api/db-check` verifies the Neon connection (existing route from `development`).

**Database table expected (from Linus’s branch pattern on `development`):**

```sql
-- public.projects
id, project_name, tracks, members, devpost_link, submitter_name, ...
```

**Not yet in DB:** judged status, judge notes, real judging slots/rooms (slots are generated client-side when using DB projects).

---

## Architecture overview

```
app/judging/
  page.tsx              Server Component — fetches data, renders portal
  layout.tsx            Judging shell wrapper + Toaster
  judging.css           Scoped design tokens & layout classes
  judging-portal.tsx    Client Component — all interactive state

components/judging/
  judging-header.tsx    Top bar — event name, progress counter
  location-board.tsx    Signature hero — giant table number
  project-spotlight.tsx ProjectHero + ProjectDetails
  session-timer.tsx     Live countdown (updates every second)
  session-rail.tsx      Schedule list (sidebar / mobile collapsible)
  judge-notes-panel.tsx Private notes textarea

lib/judging/
  types.ts              JudgingProject, JudgingSlot, JudgeNotes
  constants.ts          EVENT_NAME
  format.ts             Time formatting, location parsing, slot progress
  mock-data.ts          5 demo projects + 4 demo slots
  get-data.ts           Server-side fetch: DB or mock
```

**Rendering flow:**

1. `page.tsx` calls `getJudgingProjects()` and `getJudgingSlots()`.
2. Passes `projects`, `slots`, `dataSource` to `<JudgingPortal />`.
3. Portal holds client state: `activeProjectId`, `judgedIds`, `notes`, `showSchedule`.
4. Selecting a schedule row scrolls to top and switches the active project.

---

## Every file created or modified

### Created — judging route

| File | Description |
|------|-------------|
| `client/app/judging/page.tsx` | Server page; `dynamic = "force-dynamic"`; wires data to portal |
| `client/app/judging/layout.tsx` | Wraps children in `.judging-shell`; Sonner toaster |
| `client/app/judging/judging.css` | Full scoped CSS design system |
| `client/app/judging/judging-portal.tsx` | Main client UI orchestrator |
| `client/app/judging/README.md` | This file |

### Created — components

| File | Description |
|------|-------------|
| `client/components/judging/judging-header.tsx` | White header bar with judged count (e.g. `2/4`, `50% complete`) |
| `client/components/judging/location-board.tsx` | Parses room string; renders giant table number in hero |
| `client/components/judging/project-spotlight.tsx` | `ProjectHero` (full-bleed black band) + `ProjectDetails` (description, meta) |
| `client/components/judging/session-timer.tsx` | Countdown for live slots; `hero` and `inline` variants |
| `client/components/judging/session-rail.tsx` | Schedule list with times, rooms, Now/Next/Done/Judged states |
| `client/components/judging/judge-notes-panel.tsx` | Large notes textarea per project |

### Created — lib

| File | Description |
|------|-------------|
| `client/lib/judging/types.ts` | TypeScript types |
| `client/lib/judging/constants.ts` | `EVENT_NAME = "HackCanada"` |
| `client/lib/judging/format.ts` | `formatSlotTime`, `formatSlotRange`, `formatSlotTimeShort`, `getInitials`, `getTimeRemaining`, `getSlotProgress`, `parseLocation` |
| `client/lib/judging/mock-data.ts` | 5 projects (Aurora Transit, Harvest Ledger, etc.) + 4 slots with relative times |
| `client/lib/judging/get-data.ts` | `getJudgingProjects()`, `getJudgingSlots()` |

### Created — tooling / docs

| File | Description |
|------|-------------|
| `.cursor/skills/frontend-design/SKILL.md` | Rewritten design skill (see below) |

### Modified — shared client files

| File | Change |
|------|--------|
| `client/app/layout.tsx` | Added `fredoka.variable` to `<html>` for `--font-fredoka` CSS variable |
| `client/lib/fonts.ts` | Fredoka now exports `variable: "--font-fredoka"` (was class-only) |

### Created then deleted

| File | Why removed |
|------|-------------|
| `client/components/judging/capital-bar.tsx` | Virtual money UI — wrong for in-person judging |
| `client/components/judging/allocation-panel.tsx` | Slider / quick dollar amounts — removed |
| `client/components/judging/portfolio-ledger.tsx` | Capital distribution sidebar — removed |
| `client/components/judging/submit-dialog.tsx` | Confirm save allocations dialog — removed |
| `client/components/judging/round-progress.tsx` | Replaced by schedule judged states in session rail |
| `client/scripts/check-db.ts` | Temporary DB probe script — deleted after use |

---

## Design evolution (all iterations)

### Iteration 1 — Initial portal (virtual capital)

Built from the root `readme.md` description (“judges allocate virtual investment funds”):

- $10,000 budget, capital bar, allocation slider
- Quick amounts ($500, $1k, $2.5k, $5k)
- Portfolio ledger with proportion bars
- Save allocations + confirm dialog
- Dark navy dashboard aesthetic with blue glows and grid background

**Feedback:** Wrong concept — in-person event, no money UI.

### Iteration 2 — In-person pivot

Removed all money/allocation. Replaced with:

- Schedule queue with Live / Next / Done
- “Mark as judged” (client-side `Set<string>`)
- Judge notes (client-side `Record<string, string>`)
- Room/location emphasis
- Warm paper editorial aesthetic (light mode) to avoid generic dark AI dashboard

### Iteration 3 — Anti-AI polish

User asked for less “AI looking”:

- Removed dark mode, grid backgrounds, glass blur, gradient panels
- Removed uppercase `TRACKING-WIDEST` eyebrow labels
- Signature element: **departure-board location block** (black card, table number)
- Teal actions (`#115E59`), red live state (`#B91C1C`)
- Sentence case copy throughout

### Iteration 4 — Bigger & more outstanding (current)

User asked for larger, more dramatic UI:

- **Full-bleed black hero** spanning viewport width
- Table number up to **~11rem** (`clamp(5.5rem, 20vw, 11rem)`)
- Project title up to **~4.5rem** in hero
- Red **live bar** across top of hero when slot is active
- Pulsing **LIVE** pill
- Large tabular countdown timer in hero
- Wider layout (`max-width: 80rem`)
- Larger description text, schedule panel, notes field
- Fixed footer with prominent **Mark as judged** CTA (`j-cta` class)
- Selecting a schedule item scrolls to top

---

## Current UI — what judges see

### Header (`judging-header.tsx`)

- HackCanada · Judge desk
- Judged counter: `2/4` with `% complete`
- Link back to portals (desktop)
- “preview” label when using mock data

### Hero (`ProjectHero` + `LocationBoard`)

Full-width black band:

- Left: **GO HERE NOW** + giant table number (e.g. `4`) + venue (e.g. Maple Hall)
- Right: LIVE pill (if active) + project name + team + large countdown

Room strings like `Maple Hall · Table 4` are parsed by `parseLocation()` into venue + table number.

### Content area

- **Project description** (large body text)
- **Meta grid:** team members, track pills, Devpost link
- **Notes:** large textarea, per-project, device-local only
- **Schedule sidebar** (desktop, sticky) or collapsible (mobile)

### Footer (fixed)

- Context message (desktop)
- **Mark as judged** button (large, teal) or **Undo** if already judged

### Empty state

If no projects: centered message to contact an organizer.

---

## Component reference

### `JudgingPortal` state

| State | Type | Purpose |
|-------|------|---------|
| `activeProjectId` | `string` | Currently viewed project |
| `judgedIds` | `Set<string>` | Projects marked judged (not persisted) |
| `notes` | `JudgeNotes` | Per-project notes (not persisted) |
| `showSchedule` | `boolean` | Mobile schedule toggle |

### `SessionTimer`

- Ticks every 1s when status is `live`
- `variant="hero"` — large text on black background
- `variant="inline"` — smaller (available, used in older layouts)

### `SessionRail`

- Grid rows: time | project name + room | status icon
- `aria-current="true"` on active row
- Live active row: red left inset border (`j-schedule-row--live`)
- Judged projects: strikethrough name + green check

---

## Data layer

### `getJudgingProjects()`

1. No `DATABASE_URL` → mock
2. Query `projects` table
3. Empty or error → mock
4. Maps DB rows to `JudgingProject` (description is auto-generated placeholder for DB imports)

### `getJudgingSlots(projects, source)`

- **Mock source:** returns `MOCK_SLOTS` (4 slots with dynamic relative times)
- **Database source:** generates up to 4 synthetic slots from first 4 projects (15 min each, 25 min apart); first = live, second = upcoming, rest = done. Rooms use `project.room ?? "TBD"`.

**Important:** Real judging slots from admin (Tenzin’s work) are **not** wired yet.

### Mock projects (5)

1. Aurora Transit — Maple Hall · Table 4 (live slot)
2. Harvest Ledger — Cedar Room · Table 2
3. Signal Garden — Maple Hall · Table 7
4. Forge Cartographer — Pine Atrium · Table 1 (done)
5. Tide Relay — Cedar Room · Table 9

---

## Types & constants

```ts
// types.ts
JudgingProject { id, name, team, tracks, members, description, devpostUrl, room }
JudgingSlot    { id, projectId, startTime, endTime, room, status }
JudgeNotes     = Record<string, string>
// status: "upcoming" | "live" | "done"

// constants.ts
EVENT_NAME = "HackCanada"
```

### `format.ts` utilities

| Function | Purpose |
|----------|---------|
| `formatSlotTime` | e.g. `8:45 PM` |
| `formatSlotTimeShort` | 24h e.g. `20:45` for schedule column |
| `formatSlotRange` | `8:45 PM – 9:00 PM` |
| `getInitials` | Avatar initials from name |
| `getTimeRemaining` | `{ label: "4:32", minutes, seconds }` |
| `getSlotProgress` | 0–100 for slot elapsed % |
| `parseLocation` | Splits `Maple Hall · Table 4` → venue + table number |

---

## CSS design system

All classes live in `client/app/judging/judging.css`, scoped under `.judging-shell`.

### Color tokens

| Token | Value | Use |
|-------|-------|-----|
| `--j-paper` | `#f5f3ef` | Page background |
| `--j-ink` | `#141210` | Primary text / hero background |
| `--j-muted` | `#6b6560` | Secondary text |
| `--j-faint` | `#9c9690` | Tertiary text |
| `--j-border` | `#e0ddd6` | Borders |
| `--j-white` | `#ffffff` | Cards, header |
| `--j-live` | `#e11d2e` | Live indicator, countdown |
| `--j-action` | `#115e59` | Primary button (teal) |
| `--j-done` | `#166534` | Judged state |

### Key CSS classes

| Class | Purpose |
|-------|---------|
| `.j-hero` | Full-bleed black hero section |
| `.j-hero-live-bar` | 4px red bar at top when live |
| `.j-hero-grid` | 2-column hero layout (location + project) |
| `.j-location-table-num` | Giant Fredoka table number |
| `.j-hero-title` | Giant project name |
| `.j-live-pill` | Red LIVE badge with pulse dot |
| `.j-content` | Main content area padding |
| `.j-content-grid` | Content + schedule sidebar grid |
| `.j-schedule-panel` | White schedule card |
| `.j-schedule-row` | Individual schedule row |
| `.j-notes-input` | Large notes textarea |
| `.j-footer` / `.j-cta` | Fixed footer and primary button |

`prefers-reduced-motion` disables animations and transitions.

---

## Shared app changes

### `client/app/layout.tsx`

- Added `${fredoka.variable}` to `<html>` so judging CSS can use `var(--font-fredoka)` for the table number only.
- Root body still uses Fredoka + blue `bg-primary` for other portals (`/`, `/admin`, etc.).
- Judging portal overrides appearance entirely via `.judging-shell` (warm paper, not blue).

### `client/lib/fonts.ts`

- Fredoka exports CSS variable `--font-fredoka` in addition to `.className`.

---

## Frontend design skill

Created/rewrote `.cursor/skills/frontend-design/SKILL.md` based on a critique of the original skill doc.

**Additions include:**

- When to apply / when not to apply
- Greenfield vs in-system rules (extend shared app, don’t full re-skin)
- Fidelity levels (rough draft → ship)
- Operational uniqueness checklist before coding
- Motion rules (functional vs atmospheric vs decorative)
- Required design plan template before UI code
- Example of weak vs strong hero copy
- Removed vague “work through a similar prompt” instruction

---

## Files removed during development

| Phase | Removed |
|-------|---------|
| Money UI pivot | `capital-bar.tsx`, `allocation-panel.tsx`, `portfolio-ledger.tsx`, `submit-dialog.tsx` |
| Layout simplification | `round-progress.tsx` (merged into session rail) |
| Temp tooling | `scripts/check-db.ts` |
| Constants | `JUDGING_BUDGET`, `QUICK_ALLOCATIONS` removed from `constants.ts` |

---

## What is NOT done yet

| Item | Status |
|------|--------|
| Persist “marked as judged” to database | Client-only `Set` — lost on refresh |
| Persist judge notes to database | Client-only — lost on refresh |
| Real judging slots from admin | Synthetic slots when using DB; mock slots otherwise |
| Room data from DB projects | `room` is `null` for DB imports; slots use `"TBD"` |
| Auth / judge identity | No login; no judge name |
| API routes for judging actions | No `POST` endpoints |
| Scoring / rubric | Not implemented |
| Integration with Tenzin’s `/admin` | Not wired |
| Git commit / push to `origin/aly/judging` | Work is local, uncommitted |
| Pull request | Not created |
| Tests | None added |
| `turbopack.root` warning | Harmless warning about lockfile path on Windows |

---

## Team integration notes

| Teammate | Portal | Branch | Relevance to judging |
|----------|--------|--------|----------------------|
| Amy | `/volunteer`, `/sponsor` | `amy/volunteer-sponsor` | — |
| Tenzin | `/admin` | `tenzin/admin` | Will own schedules, rooms, project assignment |
| Aly | `/judging` | `aly/judging` | This portal |
| Linus | `/hacker` | `linus/hacker` | Added `projects` table + API on his branch |

**Next integration steps:**

1. Align on DB schema for `judging_slots`, `judge_assignments`, `judgments` / notes.
2. Replace `getJudgingSlots()` synthetic data with real admin-created slots.
3. Add server actions or API routes to save judged status and notes.
4. Pull room info from admin schedule into project/slot records.

---

## Git status (as of last session)

```
Branch: aly/judging (from development)

Modified (not committed):
  client/app/judging/page.tsx
  client/app/layout.tsx
  client/lib/fonts.ts

Untracked (not committed):
  .cursor/skills/frontend-design/SKILL.md
  client/app/judging/judging-portal.tsx
  client/app/judging/judging.css
  client/app/judging/layout.tsx
  client/app/judging/README.md
  client/components/judging/   (entire folder)
  client/lib/judging/          (entire folder)

Also local (gitignored):
  client/.env.local            (DATABASE_URL configured)
  client/node_modules/
```

To commit when ready:

```bash
git checkout aly/judging
git add client/app/judging client/components/judging client/lib/judging
git add client/app/layout.tsx client/lib/fonts.ts
git add .cursor/skills/frontend-design/SKILL.md
git commit -m "Add in-person judge desk portal at /judging"
git push -u origin aly/judging
```

---

## Quick reference — URLs

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Portal picker |
| http://localhost:3000/judging | Judge desk |
| http://localhost:3000/api/db-check | DB connection test |

---

*Last updated: July 4, 2026 — Aly, HackCanada judging platform.*
