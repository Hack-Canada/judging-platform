# Judge Portal (`/judging`) — Complete Documentation

**Author:** Aly  
**Branch:** `aly/judging` (pushed to remote as `aly-judging` — Git cannot have both `aly` and `aly/judging` as branch names when `aly` exists on origin)  
**Route:** `http://localhost:3000/judging`  
**App location:** `client/` (Next.js App Router). The old `frontend/` app is deprecated.  
**Last updated:** July 4, 2026

---

## Table of contents

1. [What this is](#what-this-is)
2. [What this is NOT](#what-this-is-not)
3. [Quick start](#quick-start)
4. [Architecture overview](#architecture-overview)
5. [Complete file tree](#complete-file-tree)
6. [Data layer — database vs mock](#data-layer--database-vs-mock)
7. [TypeScript types](#typescript-types)
8. [Server page and layout](#server-page-and-layout)
9. [Main orchestrator — `judging-portal.tsx`](#main-orchestrator--judging-portaltsx)
10. [Every UI component](#every-ui-component)
11. [Every lib module](#every-lib-module)
12. [API routes and database tables](#api-routes-and-database-tables)
13. [localStorage keys](#localstorage-keys)
14. [Streams (multi-track judging)](#streams-multi-track-judging)
15. [Slot status derivation](#slot-status-derivation)
16. [Schedule slip offset](#schedule-slip-offset)
17. [Offline judging and sync queue](#offline-judging-and-sync-queue)
18. [Judge actions and flows](#judge-actions-and-flows)
19. [Keyboard shortcuts](#keyboard-shortcuts)
20. [Design system (`judging.css`)](#design-system-judgingcss)
21. [Mobile vs desktop layout](#mobile-vs-desktop-layout)
22. [Environment variables](#environment-variables)
23. [URL query parameters](#url-query-parameters)
24. [Mock data reference](#mock-data-reference)
25. [Production safety](#production-safety)
26. [What is NOT implemented yet](#what-is-not-implemented-yet)
27. [Proposed backend schema (for Tenzin)](#proposed-backend-schema-for-tenzin)
28. [Git commands](#git-commands)
29. [Design critique history](#design-critique-history)
30. [External critique response (July 2026)](#external-critique-response-july-2026)

---

## What this is

The judge portal is an **in-person hackathon judging desk**. Judges walk between tables/rooms with their phone. The UI is optimized for:

- **Wayfinding first** — giant table number on a black “departure board” hero
- **Project context second** — name, team, description, Devpost link
- **Schedule navigation** — rail with search/filter, live/upcoming/done states
- **Mark as judged** — one tap, auto-advance to next unjudged slot
- **Private notes** — per project, saved on device
- **Offline resilience** — marks work without Wi-Fi; sync when back online
- **Schedule slip** — organizer shifts all displayed times when the event runs late

The aesthetic is **warm paper editorial** (`#F5F3EF`) with a **full-bleed black hero** (`#141210`). It deliberately avoids generic AI-dashboard patterns (glass cards, teal gradients, green success toasts).

---

## What this is NOT

| Removed / never built | Why |
|---------------------|-----|
| Virtual money / allocation UI | Wrong model — HackCanada judging is in-person, not Gavel-style investing |
| Numeric scores / rubric | Schema not decided yet — see [Proposed backend schema](#proposed-backend-schema-for-tenzin) |
| Full judge authentication | No login — identity can be a future organizer-issued code |
| Real `judging_slots` from admin | Slots are synthetic when using DB projects; mock has hand-written slots |
| Server-side notes persistence | Notes live in localStorage only (attached to sync queue items when marking) |
| Virtualized schedule list | Search + scroll + max-height for now; `@tanstack/react-virtual` not added |

---

## Quick start

```bash
cd client
npm install
```

Create `client/.env.local`:

```env
DATABASE_URL=postgresql://...   # Neon connection string
# Optional:
ORGANIZER_KEY=your-secret       # Protects POST /api/judging-config
JUDGING_SCHEDULE_OFFSET_MINUTES=0
JUDGING_SCALE_DEMO=1            # Adds 40 extra mock projects for scroll testing
```

```bash
npm run dev
# Open http://localhost:3000/judging
```

Verify DB connection: `http://localhost:3000/api/db-check`

Build: `npm run build` (must run from `client/`)

---

## Architecture overview

```
Browser (client)
├── Server Component: page.tsx
│   ├── getJudgingProjects()  → projects + streams + source
│   ├── getJudgingSlots()     → raw slots (no status field)
│   └── getScheduleOffsetMinutes() → initial offset from DB/env
│
└── Client Component: judging-portal.tsx
    ├── applyScheduleOffset(slots)     → shift times by slip
    ├── withDerivedStatus(slots, now)  → add upcoming|live|done
    ├── slotsForStream()               → filter by active stream tab
    ├── localStorage (per stream)      → judgedIds, skippedIds, notes
    ├── offline queue                  → pending server sync
    └── UI components (hero, rail, footer, dock, ribbons, etc.)
```

**Critical rule:** Slot `status` is **never stored**. It is derived on every tick from `now()` vs `startTime`/`endTime` (after schedule offset is applied). A tab left open will correctly flip slots from upcoming → live → done as time passes.

---

## Complete file tree

```
client/
├── app/
│   ├── admin/
│   │   ├── page.tsx                    # Organizer schedule slip control
│   │   └── admin-schedule-controls.tsx
│   ├── api/
│   │   ├── db-check/route.ts           # Neon health check
│   │   ├── judging-config/route.ts     # GET/POST schedule offset
│   │   └── judgments/route.ts          # POST offline sync queue
│   └── judging/
│       ├── page.tsx                    # Server entry — fetches data, renders portal
│       ├── layout.tsx                  # .judging-shell wrapper + metadata
│       ├── judging.css                 # Scoped design system (all --j-* tokens)
│       ├── judging-portal.tsx          # All client state and orchestration
│       └── README.md                   # This file
│
├── components/judging/
│   ├── action-feedback.tsx             # Inline undo strip above footer (not Sonner)
│   ├── break-banner.tsx                # "Break until X · next: Y"
│   ├── completion-banner.tsx           # Stream complete — no trap screen
│   ├── judge-notes-panel.tsx           # Per-project textarea
│   ├── judging-header.tsx              # Event name, progress, sync badges
│   ├── live-ribbon.tsx                 # Black bar when browsing away from live slot
│   ├── loading-shell.tsx               # Skeleton while hydrating localStorage
│   ├── location-board.tsx              # Departure-board table number
│   ├── project-spotlight.tsx           # ProjectHero + ProjectDetails
│   ├── schedule-dock.tsx               # Mobile bottom drawer for full schedule
│   ├── schedule-offset-panel.tsx       # Organizer "+N min behind" control
│   ├── session-rail.tsx                # Searchable/filterable schedule list
│   ├── session-timer.tsx               # Countdown, overtime, progress bar
│   ├── stream-selector.tsx             # Multi-stream tabs
│   └── sync-status.tsx                 # Synced / offline / pending badges
│
└── lib/judging/
    ├── constants.ts                    # EVENT_NAME = "HackCanada"
    ├── db-setup.ts                     # Lazy CREATE TABLE + offset read/write
    ├── format.ts                       # Time, location, description utilities
    ├── get-data.ts                     # Server data fetching
    ├── mock-data.ts                    # 5 demo projects + 5 slots + 3 streams
    ├── offline-queue.ts                # Sync queue + offset fetch/publish
    ├── schedule-offset.ts              # Apply offset to slot ISO times
    ├── slots.ts                        # Status derivation, break detection, navigation
    ├── storage.ts                      # Per-stream localStorage
    ├── types.ts                        # All TypeScript types
    └── use-judging-sync.ts             # Hook: online/offline, sync interval, offset poll
```

**Shared dependencies outside judging:**
- `client/lib/db.ts` — lazy Neon `getSql()`
- `client/lib/fonts.ts` — Rubik + Fredoka CSS variables
- `client/app/layout.tsx` — loads `fredoka.variable` on `<html>` for table numbers
- `client/components/ui/drawer.tsx` — Vaul drawer used by `schedule-dock.tsx`

---

## Data layer — database vs mock

### `getJudgingProjects()` (`lib/judging/get-data.ts`)

Runs **server-side** on every page load (`dynamic = "force-dynamic"`).

| Condition | Result | Header label |
|-----------|--------|--------------|
| No `DATABASE_URL` | Mock projects + `MOCK_STREAMS` | `· preview` (dev only) |
| DB query succeeds, rows exist | Real `projects` table rows | `· live` |
| DB query succeeds, zero rows | Mock fallback | `· preview` |
| DB query throws | Mock fallback | `· preview` |

**SQL query:**
```sql
SELECT id, project_name, tracks, members, devpost_link, submitter_name
FROM projects
ORDER BY project_name
```

**Field mapping (DB → `JudgingProject`):**

| DB column | App field | Notes |
|-----------|-----------|-------|
| `id` | `id` | |
| `project_name` | `name` | |
| `submitter_name` | `team` | Falls back to `"Independent team"` |
| `tracks` | `tracks` | Array; first track becomes stream ID |
| `members` | `members` | |
| `devpost_link` | `devpostUrl` | Opens in new tab with `rel="noopener noreferrer"` |
| — | `description` | Always `null` from DB today |
| — | `room` | Always `null` from DB today |

**Streams from DB:** Built dynamically — one stream per unique primary track (`tracks[0]`), slugified as stream ID (e.g. `"Sustainability"` → `"sustainability"`).

### `getJudgingSlots()` (`lib/judging/get-data.ts`)

| Source | Behavior |
|--------|----------|
| `mock` | Returns `MOCK_SLOTS` (5 hand-written slots across 3 streams). If `JUDGING_SCALE_DEMO=1`, adds 40 generated slots on `stream-maple`. |
| `database` | **Synthesizes** one slot per project: 25 min apart within each stream, 15 min duration, snapped to :00/:05. `room` comes from `project.room` (null for DB imports). |

**Important:** Real judging slots from an admin assignment system do not exist yet. DB mode gives every project a fake sequential schedule grouped by track.

### What is real vs fake today

| Data | Source when DB connected |
|------|--------------------------|
| Project names, teams, tracks, members, Devpost | **Real** from `projects` table |
| Slot times | **Synthetic** — generated at page load from `now()` |
| Table / room | **Null** for DB projects (shows “Table not assigned yet”) |
| Descriptions | **Null** — UI shows team-based fallback copy |
| Judged status | **localStorage only** (+ sync log on server) |
| Notes | **localStorage only** |
| Schedule offset | **DB** (`judging_event_config`) when `DATABASE_URL` set |

---

## TypeScript types

File: `lib/judging/types.ts`

```typescript
JudgingProject {
  id, name, team, tracks[], members[],
  description: string | null,
  devpostUrl: string | null,
  room: string | null
}

JudgingStream {
  id, name,
  shortName?: string   // Used in stream tabs
}

JudgingSlot {          // Raw from server — NO status field
  id, projectId, streamId,
  startTime: ISO string,
  endTime: ISO string,
  room: string | null
}

JudgingSlotWithStatus = JudgingSlot & { status: "upcoming" | "live" | "done" }

JudgingStorage {       // Per-stream localStorage
  judgedIds: string[],
  skippedIds: string[],
  notes: Record<projectId, string>
}

DataSource = "database" | "mock"
MockReason = "no_env" | "empty" | "error" | "demo"
ScheduleFilter = "remaining" | "all" | "judged" | "skipped"
```

---

## Server page and layout

### `page.tsx`

- `export const dynamic = "force-dynamic"` — never statically cached
- Reads `searchParams`: `stream`, `organizer`
- Calls `getJudgingProjects()`, `getJudgingSlots()`, `getScheduleOffsetMinutes()`, `pickInitialStream()`
- Passes everything to `<JudgingPortal />`

### `layout.tsx`

- Wraps children in `<div className="judging-shell">`
- Imports `judging.css` (scoped design system)
- Sets metadata: title `"Judge desk · HackCanada"`
- **No Sonner toaster** — feedback is inline `ActionFeedback` component

---

## Main orchestrator — `judging-portal.tsx`

Single client component owning all interactive state.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `projects` | `JudgingProject[]` | All projects (all streams) |
| `slots` | `JudgingSlot[]` | All slots (all streams) |
| `streams` | `JudgingStream[]` | Tab definitions |
| `dataSource` | `"database" \| "mock"` | |
| `mockReason` | optional | Why mock was used |
| `initialStreamId` | optional | From `?stream=` or first stream |
| `initialScheduleOffset` | number | From server DB/env |
| `showOrganizerPanel` | boolean | From `?organizer=1` |

### State variables

| State | Purpose |
|-------|---------|
| `now` | Updated every 1s — drives derived slot status |
| `hydrated` | false until localStorage loaded for active stream |
| `scheduleOffsetMinutes` | Organizer slip; shifts all slot times |
| `activeStreamId` | Current stream tab |
| `activeProjectId` | Project shown in hero |
| `judgedIds` | Set of project IDs marked judged in active stream |
| `skippedIds` | Set of project IDs marked skipped (subset of judged) |
| `earlyMarkedIds` | Marked while slot was still `upcoming` |
| `notes` | `Record<projectId, string>` for active stream |
| `feedback` | Inline action feedback (undo/redo strip) |

### Data pipeline (useMemo chain)

```
slots (from server)
  → applyScheduleOffset(slots, scheduleOffsetMinutes)
  → withDerivedStatus(offsetSlots, now)        // adds status
  → slotsForStream(derivedSlots, activeStreamId)
  → streamSlots (used everywhere in UI)
```

### Effects

1. **1s tick** — `setNow(Date.now())` for live countdown and status
2. **Stream change** — `loadJudgingStorage(streamId)` → hydrate judged/skipped/notes
3. **Persist** — `saveJudgingStorage` on every change to judged/skipped/notes
4. **Auto-select project** — prefers live unjudged slot, else first unjudged, else first slot
5. **Feedback auto-dismiss** — 4s unless action button present
6. **Keyboard shortcuts** — see [Keyboard shortcuts](#keyboard-shortcuts)

### Key functions

| Function | Behavior |
|----------|----------|
| `completeJudging(id, "judged"\|"skipped")` | Add to judgedIds; optionally skippedIds; enqueue sync; show feedback with Undo; auto-advance to next unjudged |
| `unmarkJudging(id)` | Remove from judgedIds + skippedIds + earlyMarkedIds |
| `unmarkWithToast(id)` | unmark + enqueue `"unmarked"` + feedback with Redo |
| `queueJudgment(id, action)` | `enqueueJudgment()` + `syncNow()` |
| `resetStreamProgress()` | confirm dialog → clear all judged state + localStorage for stream |
| `persistAndSwitchStream(id)` | save current stream → load next stream's localStorage |
| `selectProject(id)` | set active + scroll to top |

### Render order (top to bottom)

1. `JudgingHeader` — progress, sync badges, offset label
2. `ScheduleOffsetPanel` — only if `?organizer=1`
3. `StreamSelector` — tabs (hidden if ≤1 stream)
4. `CompletionBanner` — if all projects in stream judged (does NOT block UI)
5. `BreakBanner` — if gap ≥5 min between slots and nothing live
6. `LiveRibbon` — if viewing non-live project while another slot is live
7. `ProjectHero` — black band with location board + timer
8. Content grid — `ProjectDetails` + `JudgeNotesPanel` + desktop `SessionRail`
9. `ScheduleDock` — mobile only, fixed above footer
10. `footer` — `ActionFeedback` + CTA buttons

---

## Every UI component

### `judging-header.tsx`
- White bar: event name, stream name, data source label (`live` / `preview`)
- Large `judgedCount/totalCount` with thin progress bar underneath
- `SyncStatusBadge` — synced / syncing / pending / offline
- Amber offset badge when schedule slip ≠ 0
- **Production mock banner:** full-width red alert if `NODE_ENV=production` && `dataSource=mock`

### `stream-selector.tsx`
- Horizontal tabs, one per stream
- Shows `shortName` + `judged/total` per stream
- Hidden when only one stream exists

### `location-board.tsx`
- Parses room string via `parseLocation()` — extracts venue + table number
- **Active wayfinding:** `"GO HERE NOW"` + giant Fredoka table number (up to ~11rem)
- **Judged recap:** quiet `"Done"` + smaller table text (NOT giant number)
- **Early mark:** `"Marked early"` sublabel
- `LocationPending` export exists but hero uses inline quiet text instead

### `project-spotlight.tsx`

**`ProjectHero`:**
- Full-bleed black `.j-hero` band
- Red 4px live bar at top when slot is live and not judged
- Live pill (red), Judged pill (outlined, muted), "Up next" label
- Project title clamped to 3 lines at `clamp(2.25rem, 6vw, 4.5rem)`
- `SessionTimer` in hero variant
- If no room and not judged: `"Table not assigned yet — check with an organizer"`

**`ProjectDetails`:**
- Description or team-based fallback ("Built by {team} — open Devpost…")
- Meta grid: team members, tracks (max 3 visible + "+N more"), Devpost link
- Track pills use quiet styling (`.j-track-pill--quiet`)

### `session-timer.tsx`
- Ticks every 1s when upcoming or live
- **Judged:** `"You marked this project as judged"`
- **Done:** `"Ended 5:02 PM"`
- **Upcoming:** `"Starts 5:02 PM · in 14 min"`
- **Live:** red `MM:SS left` + red progress bar (hero only)
- **Overtime:** amber `"Overtime +M:SS"`

### `session-rail.tsx`
- Search input (filters name, team, tracks)
- Filter pills: Remaining / All / Judged / Skipped
- Scrollable list (`max-height: min(60vh, 32rem)`)
- Each row: time, name, room, status icon (Now / Next / checkmark / Skipped)
- Judged names: strikethrough + faint checkmark
- Live row: red left border when active
- `embedded` prop: strips outer panel chrome for mobile drawer

### `schedule-dock.tsx` (mobile only, `lg:hidden`)
- Fixed bar above footer showing `judged/total`, project name, room/time
- Tap opens Vaul bottom drawer with full `SessionRail`
- Closes drawer on project select

### `live-ribbon.tsx`
- Black bar (matches hero): `"Live now: {name} · {time} left · {room}"`
- Paper `"Go there"` button → jumps to live project

### `break-banner.tsx`
- White bar: `"Break until 5:27 · 14 min · Next: Aurora Transit"`
- `"Preview"` link → selects next project
- Only shows when gap between last ended slot and next upcoming ≥ 5 minutes

### `completion-banner.tsx`
- White bar when stream 100% judged
- **Does not replace the page** — judge can still browse and unmark
- `"Reset stream"` button with confirm dialog

### `judge-notes-panel.tsx`
- Label: `"Private notes for {name} — saved on this device only."`
- Placeholder: `"What stood out? Questions to follow up on later?"`
- Saved to per-stream localStorage on every keystroke

### `action-feedback.tsx`
- Fixed strip above footer (not a toast library)
- Shows message + detail + optional action button (Undo/Redo) + dismiss ×
- Paper/ink styling — no green success colors

### `sync-status.tsx`
- Small badges in header: offset label + sync state

### `schedule-offset-panel.tsx`
- Organizer control: number input (-180 to +180, step 5) + Apply
- POSTs to `/api/judging-config`
- Positive = event running behind

### `loading-shell.tsx`
- Pulsing skeleton matching hero layout while localStorage hydrates

---

## Every lib module

### `format.ts` — utilities

| Function | Purpose |
|----------|---------|
| `formatSlotTime(iso)` | `"5:02 PM"` everywhere (12h, en-CA) |
| `formatSlotRange(start, end)` | `"5:02 PM – 5:17 PM"` |
| `formatRelativeUntil(iso, now)` | `"in 14 min"` / `"in 1h 5m"` / `"now"` |
| `deriveSlotStatus(start, end, now)` | `"upcoming"` / `"live"` / `"done"` |
| `getTimeRemaining(end, now)` | `{ label: "12:34", overtime: false }` or `{ label: "+2:14", overtime: true }` |
| `getSlotProgress(start, end, now)` | 0–100 for progress bar |
| `isValidRoom(room)` | false for null, empty, `"TBD"`, `"location tbd"` |
| `parseLocation(room)` | Split `"Maple Hall · Table 4"` → venue + tableNumber |
| `resolveSlotRoom(slotRoom, projectRoom)` | slot room preferred, then project room |
| `getDisplayDescription(project)` | null if placeholder/missing |
| `snapToFiveMinutes(date)` | Rounds up to next :00/:05 for demo times |

### `slots.ts` — schedule logic

| Function | Purpose |
|----------|---------|
| `withDerivedStatus(slots, now)` | Attach status to each slot |
| `slotsForStream(slots, streamId)` | Filter by stream |
| `findLiveSlot(slots, judgedIds)` | First `live` slot not yet judged |
| `getNextUnjudgedProjectId(slots, judgedIds, exclude?)` | For auto-advance after mark |
| `streamProgress(slots, judgedIds)` | `{ judged, total, remaining }` |
| `getAdjacentProjectIds(slots, currentId)` | prev/next for arrow keys |
| `findBreakState(slots, judgedIds, now)` | Break banner data |

### `storage.ts` — per-stream localStorage

- Key pattern: `hc-judging-v2:{streamId}`
- Legacy migration: `hc-judging-v1` → first opened stream, then deleted
- `clearJudgingStorage(streamId)` — used by Reset stream

### `schedule-offset.ts`

- Key: `hc-judging-schedule-offset` (local cache of server value)
- `applyScheduleOffset(slots, minutes)` — adds N minutes to every start/end ISO
- Positive offset = schedule is N minutes behind (displayed times shift forward)

### `offline-queue.ts`

- Queue key: `hc-judging-sync-queue`
- `judgmentSyncKey(judgeId, streamId, projectId)` — deterministic dedupe key (matches `judgments` PK)
- `enqueueJudgment()` — one row per judge+stream+project; latest action wins in queue
- `enqueueNotes()` — merges notes into existing queue row or enqueues notes-only
- `syncNotesNow()` — debounced notes POST (400ms in portal); queues when offline
- `flushJudgmentQueue()` — POST all items to `/api/judgments`
- `fetchJudgingConfig()` — returns `{ scheduleOffsetMinutes, serverNow }` for clock delta at load

### `judge-identity.ts`

- URL param `?code=J42` saved to `hc-judge-code` in localStorage
- `resolveJudgeId(code)` — returns code or `__anonymous__` when missing
- `hasAttributableJudge(judgeId)` — false for anonymous

### `use-judging-sync.ts`

Hook used by portal:
- On mount: flush queue, fetch offset
- Every 30s: flush queue
- Every 60s: fetch offset
- On `online` event: flush + fetch
- On window `focus`: flush + fetch
- Returns `{ status, pendingCount, syncNow, refreshPending, refreshOffset }`

### `db-setup.ts`

Lazy creates tables on first API call:

**Sync store decision:** `judgments` is the authoritative current-state read model (PK: `judge_id, stream_id, project_id`). Reconcile on `client_timestamp`, not `received_at`. `judging_sync_log` is append-only audit only.

- `judging_event_config` — key/value JSONB (schedule offset under key `'schedule'`)
- `judgments` — current state per judge+stream+project
- `judging_sync_log` — append-only audit trail (never read for state)

### `mock-data.ts`

See [Mock data reference](#mock-data-reference).

---

## API routes and database tables

### `GET /api/judging-config`

Returns `{ scheduleOffsetMinutes: number, serverNow: string }` (`serverNow` is ISO UTC).

Resolution order for offset:
1. DB `judging_event_config` where `key = 'schedule'`
2. Env `JUDGING_SCHEDULE_OFFSET_MINUTES`
3. `0`

Client computes `clientServerDeltaMs = serverNow - Date.now()` at load to mitigate device clock skew (does not correct mid-session drift).

### `POST /api/judging-config`

Body: `{ scheduleOffsetMinutes: number }`  
Clamped to -180…+180, rounded to integer.

Auth: if `ORGANIZER_KEY` env is set, requires header `x-organizer-key: {value}`.

Requires `DATABASE_URL` — returns 503 without it.

### `POST /api/judgments`

Body: `{ items: QueuedJudgment[] }`

Each item:
```json
{
  "syncKey": "J42:stream-maple:proj-aurora",
  "judgeId": "J42",
  "streamId": "stream-maple",
  "projectId": "proj-aurora",
  "action": "judged | skipped | unmarked | notes",
  "skipReason": "absent | not_ready | wrong_track | null",
  "notes": "optional string",
  "clientTimestamp": "ISO string"
}
```

Response: `{ ok: true, syncedKeys: string[] }`

Without `DATABASE_URL`: acknowledges all items (queue clears but nothing persisted server-side).

With DB: upserts into `judgments` on `(judge_id, stream_id, project_id)` conflict. Only applies when incoming `client_timestamp >= existing` (offline retries may arrive out of order). Appends every item to `judging_sync_log`.

### Table: `judgments`

```sql
CREATE TABLE IF NOT EXISTS judgments (
  judge_id TEXT NOT NULL,
  stream_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  action TEXT NOT NULL,
  skip_reason TEXT,
  notes TEXT,
  client_timestamp TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (judge_id, stream_id, project_id)
);
```

### Table: `judging_event_config`

```sql
CREATE TABLE IF NOT EXISTS judging_event_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Example row: key='schedule', value='{"scheduleOffsetMinutes": 15}'
```

### Table: `judging_sync_log`

```sql
CREATE TABLE IF NOT EXISTS judging_sync_log (
  id BIGSERIAL PRIMARY KEY,
  judge_id TEXT NOT NULL,
  stream_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  action TEXT NOT NULL,
  skip_reason TEXT,
  notes TEXT,
  client_timestamp TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Tables are created automatically on first API request (`ensureJudgingTables()`).

---

## localStorage keys

| Key | Contents | Scope |
|-----|----------|-------|
| `hc-judging-v2:{streamId}` | `{ judgedIds[], skippedIds[], skipReasons{}, notes{}, earlyMarkedIds[] }` | Per stream |
| `hc-judging-v1` | Legacy global storage | Migrated once, then deleted |
| `hc-judging-sync-queue` | `QueuedJudgment[]` pending server sync | Global |
| `hc-judge-code` | Organizer-issued judge code from `?code=` | Global |
| `hc-judging-schedule-offset` | Cached schedule offset minutes | Global |
| `hc-judging-schedule-offset` | `number` (minutes) | Global cache of server offset |

All keys are device-specific. Clearing browser data loses judged state unless synced to server.

---

## Streams (multi-track judging)

Hackathons often run parallel judging tracks (rooms, finals rounds, sponsor vs main track).

- Each `JudgingSlot` has a `streamId`
- Mock: 3 streams — `stream-maple`, `stream-cedar`, `stream-pine`
- DB: one stream per primary track (`tracks[0]` slugified)
- `StreamSelector` tabs switch streams
- **Progress is per-stream** — judging 4/4 in Maple does not affect Cedar
- **Storage is per-stream** — separate judged/notes per stream
- Deep link: `/judging?stream=stream-cedar`

When switching streams:
1. Current stream saved to localStorage
2. Next stream loaded from localStorage
3. `earlyMarkedIds` reset (not persisted)
4. Active project auto-selected (live or first unjudged)

---

## Slot status derivation

```typescript
if (now < startTime) → "upcoming"
if (now >= endTime)  → "done"
else                 → "live"
```

Applied **after** schedule offset shift.

**Live slot** = first slot where `status === "live"` AND `projectId` not in `judgedIds`.

Judged projects are excluded from live detection even if their slot time is still active.

---

## Schedule slip offset

**Problem:** Hackathons always run late. Printed schedules lie.

**Solution:** Organizer sets global offset in minutes. All judges see shifted times.

### How to set (organizer)

| Method | URL |
|--------|-----|
| Admin page | `/admin` |
| Organizer mode on judge desk | `/judging?organizer=1` |

Enter minutes → **Apply** → saved to `judging_event_config` in Neon.

### Semantics

- **+15** = event is 15 minutes behind → all slot start/end times shift **forward** by 15 minutes
- **-10** = times shift backward (event ahead of schedule)
- Clamped: -180 to +180 minutes
- Judges see amber badge: `"15 min behind"` in header
- Judges poll for changes every 60s + on window focus + on reconnect

### Client pipeline

```
server slots → applyScheduleOffset(minutes) → withDerivedStatus(now) → UI
```

Offset cached locally in `hc-judging-schedule-offset` for offline reads.

---

## Offline judging and sync queue

**Problem:** Venue Wi-Fi fails exactly when everyone hits the database.

**Solution:** Optimistic local-first marks with background sync.

### Flow

1. Judge taps **Mark judged**
2. **Immediately:** `judgedIds` updated in React state
3. **Immediately:** `saveJudgingStorage()` writes to localStorage
4. **Immediately:** `enqueueJudgment()` adds to `hc-judging-sync-queue`
5. **Async:** `flushJudgmentQueue()` POSTs to `/api/judgments`
6. On success: item removed from queue
7. On failure/offline: item stays in queue

### Sync triggers

- Immediately after each mark/unmark
- On page load
- Every 30 seconds while online
- On `window.online` event
- On window focus

### Header badges

| Badge | Meaning |
|-------|---------|
| `Synced` | Online, queue empty |
| `Syncing…` | Flush in progress |
| `Sync pending (N)` | Online but N items not yet acknowledged |
| `Offline — saved on device` | No network (queue may have items) |
| `15 min behind` | Schedule slip active |

### What works offline

- Mark judged / skip / unmark
- Notes (localStorage)
- Browse schedule
- Derived slot status (uses device clock)
- Cached schedule offset

### What requires network

- Loading projects from DB (initial page load is server-rendered — needs network for first load)
- Syncing judgments to server
- Publishing schedule offset (organizer)
- Fetching latest schedule offset from server

---

## Judge actions and flows

### Mark judged
1. Tap **Mark judged** (or press `J`)
2. Feedback strip: `"Marked as judged"` + **Undo**
3. Auto-advance to next unjudged project in stream
4. Scroll to top

### Skip (team absent)
1. Tap **Skip** (or press `S`)
2. Added to both `judgedIds` and `skippedIds`
3. Same auto-advance and feedback as judged
4. Rail shows "Skipped" label

### Unmark
1. When viewing judged project: tap **Unmark** (or press `U`)
2. Feedback: `"Unmarked as judged"` + **Redo**
3. Removes from judged + skipped + earlyMarked

### Undo (from feedback strip)
- Reverses the last mark without navigating away

### Reset stream
- Available on completion banner when 100% judged
- `window.confirm()` → clears all judged/skipped/notes for stream

### Early marking
- Allowed: judges often run off-schedule
- If marked while slot still `upcoming`: flagged in `earlyMarkedIds`
- Location board shows `"Marked early"` when reviewing that project

### Accidental mark-all recovery
- Completion banner does NOT trap the user
- Full schedule remains browsable
- **Unmark** on any judged project
- **Reset stream** for bulk mistake

---

## Keyboard shortcuts

Disabled when focus is in `INPUT`, `TEXTAREA`, or `SELECT`.

| Key | Action |
|-----|--------|
| `J` | Mark judged |
| `S` | Skip (team absent) |
| `U` | Unmark (when viewing judged project) |
| `G` | Go to live slot |
| `→` | Next project in schedule order |
| `←` | Previous project in schedule order |

---

## Design system (`judging.css`)

All styles scoped under `.judging-shell`. Does not affect other routes.

### CSS variables

| Token | Value | Usage |
|-------|-------|-------|
| `--j-paper` | `#f5f3ef` | Page background |
| `--j-ink` | `#141210` | Hero, primary CTA, progress fill |
| `--j-muted` | `#6b6560` | Secondary text |
| `--j-faint` | `#9c9690` | Tertiary text, judged checkmarks |
| `--j-border` | `#e0ddd6` | Borders |
| `--j-white` | `#ffffff` | Cards, panels |
| `--j-live` | `#e11d2e` | Live indicators, countdown (large only) |
| `--j-overtime` | `#d97706` | Overtime timer, offset badge |
| `--j-action` | `#115e59` | Secondary links (teal — not used for primary CTA) |

### Fonts

- Body: `var(--font-rubik)` (from root layout)
- Table numbers only: `var(--font-fredoka)` — departure board signature

### Key layout classes

| Class | Role |
|-------|------|
| `.j-hero` | Full-bleed black band |
| `.j-location-table-num` | Giant Fredoka number `clamp(5.5rem, 20vw, 11rem)` |
| `.j-hero-title` | Project name, 3-line clamp |
| `.j-content` | Paper content area, extra bottom padding on mobile for dock+footer |
| `.j-footer` | Fixed bottom CTA bar with `safe-area-inset-bottom` |
| `.j-schedule-dock` | Mobile fixed schedule trigger above footer |
| `.j-cta--primary` | Black ink button (Mark judged) |

### Graceful degradation rules (design principle)

- No room → collapse location board, quiet `"Table not assigned yet"` (never giant "TBD")
- No description → hide block or show team fallback (never "imported from database")
- Incomplete data shrinks UI; placeholders don't fill space

---

## Mobile vs desktop layout

| Feature | Mobile (`<1024px`) | Desktop (`≥1024px`) |
|---------|-------------------|---------------------|
| Schedule | `ScheduleDock` drawer | Sticky `SessionRail` sidebar |
| Footer CTAs | Full-width stacked buttons | Inline row |
| Go to live | Extra button in footer | `LiveRibbon` only |
| Stream tabs | Horizontal scroll | Horizontal scroll |
| Hero grid | Single column | 2-column: location + project |

Test at **375px width** — primary real-world device.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | For live data | Neon Postgres connection string |
| `ORGANIZER_KEY` | Optional | Protects POST `/api/judging-config` |
| `JUDGING_SCHEDULE_OFFSET_MINUTES` | Optional | Default offset when DB unavailable |
| `JUDGING_SCALE_DEMO` | Optional | Set `1` to add 40 mock projects on Maple stream |

File: `client/.env.local` (gitignored)

---

## URL query parameters

| Param | Example | Effect |
|-------|---------|--------|
| `stream` | `?stream=stream-cedar` | Open specific stream tab on load |
| `organizer` | `?organizer=1` | Show schedule slip control panel |

---

## Mock data reference

### Streams (`MOCK_STREAMS`)

| ID | Name | Short |
|----|------|-------|
| `stream-maple` | Maple Hall finals | Maple |
| `stream-cedar` | Cedar Room finals | Cedar |
| `stream-pine` | Pine Atrium finals | Pine |

### Projects (`MOCK_PROJECTS`) — 5 total

| ID | Name | Team | Room |
|----|------|------|------|
| `proj-aurora` | Aurora Transit | Northbound Labs | Maple Hall · Table 4 |
| `proj-harvest` | Harvest Ledger | Field Notes | Cedar Room · Table 2 |
| `proj-signal` | Signal Garden | Quiet Circuit | Maple Hall · Table 7 |
| `proj-forge` | Forge Cartographer | Bench Press | Pine Atrium · Table 1 |
| `proj-tide` | Tide Relay | Coastal Mesh | Cedar Room · Table 9 |

All have descriptions and `devpostUrl: "https://devpost.com"`.

### Slots (`MOCK_SLOTS`) — 5 total, relative to page load time

| Slot | Project | Stream | Timing |
|------|---------|--------|--------|
| slot-1 | Aurora | Maple | Started 15 min ago (25 min duration) — likely **live** |
| slot-2 | Harvest | Cedar | Starts in 20 min |
| slot-3 | Signal | Maple | Starts in 50 min |
| slot-4 | Forge | Pine | Ended 2 hours ago — **done** |
| slot-5 | Tide | Cedar | Starts in 80 min |

Times snapped to :00/:05 boundaries.

### Scale demo (`JUDGING_SCALE_DEMO=1`)

Adds 40 `"Demo project N"` entries on `stream-maple` for search/scroll stress testing.

---

## Production safety

| Risk | Mitigation |
|------|------------|
| Mock data in production | Full-width **red banner**: "Demo data loaded — Do not judge from this screen" |
| Silent DB failure in prod | Same red banner with `mockReason: error` |
| Judging fake projects | Banner is `role="alert"` — unmissable |
| Offline data loss | localStorage + sync queue; badge shows pending count |

---

## What is NOT implemented yet

| Item | Owner / blocker |
|------|-----------------|
| Real `judging_slots` table + admin assignment | Tenzin / backend |
| `judgments` proper schema (scores, not just sync log) | Team decision on rubric |
| Judge identity / auth | Organizer-issued code TBD |
| Devpost tagline import for descriptions | Integration task |
| Schedule slip via admin dashboard (not just /admin stub) | Admin portal build-out |
| Virtualized rail for 1000+ projects | Performance follow-up |
| Vitest for `format.ts` | Test harness task |
| Service Worker / IndexedDB offline | localStorage sufficient for one evening |
| QR scan at table → jump to project | Future UX |
| Break/gap states beyond 5-min threshold config | Fine-tuning |
| Server-side notes API | Depends on judgments schema |

---

## Proposed backend schema (for Tenzin)

Current `judging_sync_log` is an audit trail, not a full judgments model.

**Recommended tables:**

```sql
judging_slots (
  id, project_id, judge_id, stream_id,
  room, starts_at, ends_at
  -- status derived from starts_at/ends_at + schedule offset, never stored
)

judgments (
  id, judge_id, project_id, stream_id,
  judged_at, action,  -- 'judged' | 'skipped'
  notes TEXT,
  score_payload JSONB  -- shape TBD: criteria scores vs 1-5 vs pairwise
)
```

**Open product question:** What is the output of judging?
- Scores per criterion?
- Single 1–5 per track?
- Comparative/pairwise ranking (Gavel-style)?

The answer shapes `score_payload` and whether the current boolean+notes model is sufficient.

**Judge identity:** As light as an organizer-issued code in URL (`/judging?code=J42`), no full auth needed for v1.

---

## Git commands

```bash
# Branch (local name)
git checkout aly/judging

# Remote branch name (aly/judging blocked by existing origin/aly)
git push -u origin HEAD:aly-judging

# Stage judging work
git add client/app/judging client/components/judging client/lib/judging
git add client/app/api/judging-config client/app/api/judgments
git add client/app/admin

# Commit
git commit -m "Add judge portal with offline sync and schedule slip"

# Draft PR
# https://github.com/Hack-Canada/judging-platform/pull/new/aly-judging
```

---

## Design critique history

This portal went through several iterations. Key decisions:

1. **Removed virtual money UI** — wrong model for in-person HackCanada judging
2. **Departure board hero** — table number at 11rem is the signature element; location before project name
3. **No giant TBD** — incomplete data shrinks UI (CarInfo graceful degradation principle)
4. **Auto-advance after mark** — judges are one-handed between tables
5. **Unmark + reset stream** — recovery from accidental mark-all
6. **Derived slot status** — not stored; honest as time passes on idle tabs
7. **Per-stream storage** — supports parallel finals tracks at scale
8. **Removed Sonner/green toasts** — inline paper feedback strip
9. **Mobile schedule dock** — schedule was buried; phones are primary device
10. **Black live ribbon** — not pink Bootstrap alert
11. **Offline queue + schedule slip** — venue Wi-Fi and running late are certainties

---

## Routes reference

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/judging` | Judge desk |
| `http://localhost:3000/judging?code=J42` | Judge desk with attributed sync |
| `http://localhost:3000/judging?organizer=1` | Judge desk + schedule slip panel |
| `http://localhost:3000/judging?stream=stream-maple` | Deep link to stream |
| `http://localhost:3000/admin` | Organizer schedule slip |
| `http://localhost:3000/api/db-check` | Neon connection test |
| `http://localhost:3000/api/judging-config` | GET/POST schedule offset |
| `http://localhost:3000/api/judgments` | POST sync queue |

---

## External critique response (July 2026)

Independent review of this portal after the UX/offline/slip passes. **Verdict: ~85–90% technically accurate.** The critique correctly shifted focus from missing UI to **data model semantics** — where Saturday risk actually lives.

### What the critique gets right

| Issue | Status (July 2026 pass) |
|-------|-------------------------|
| **No `judge_id` in sync** | **Fixed** — `?code=J42`, stamped on every queue item |
| **Skip counted as "judged"** | **Fixed** — header/banner report `N judged · M skipped`; skips excluded from judged numerator |
| **`client_id` UUID per action** | **Fixed** — deterministic `syncKey`; `judgments` table is authoritative state |
| **Notes weak on server** | **Fixed** — debounced notes sync decoupled from marks |
| **Device clock skew** | **Mitigated at load** — `serverNow` delta applied to status derivation |
| **Cold start needs network** | **Fixed** — on-brand retry screen when SSR fetch fails |
| **Prod mock banner doesn't disable CTAs** | **Fixed** — Mark judged / Skip disabled under prod mock |
| **`earlyMarkedIds` not persisted** | **Fixed** — stored in per-stream localStorage |
| **`window.confirm` for reset** | **Fixed** — inline warm-paper confirm panel |
| **Skip / Mark adjacent on mobile** | **Fixed** — recessed Skip styling with extra gap |
| **No assignment / real slots / rubric** | Still deferred (Tenzin/team) |

### What needs qualification

- **Treating skip as "done" for navigation** (auto-advance, remaining filter) is reasonable for judge workflow. The bug is **reporting** — calling skips "judged" in the header and completion metrics. Fix: unified nav, split reporting (`10 judged · 2 skipped`).
- **Excluding judged projects from live detection** is intentional (judge is done with that table) but can confuse if interpreted as "room status" rather than "judge status."
- **"Real tool, not a demo"** — true for one judge, one evening, tab left open. Not true for multi-judge winner selection or cold-start at kickoff.

### What is intentionally deferred (not bugs)

Listed in [What is NOT implemented yet](#what-is-not-implemented-yet). The critique agrees these are the critical path, not more hero polish.

### Priority order for Saturday (agreed with critique)

1. **Judge identity** — `?code=J42` in URL, stamped on every queue item. Makes sync attributable. Not full auth; organizer-issued code.
2. **Assignment + real slots** — Tenzin/admin. Unblocks true "your schedule," real rooms/times, sane stream boundaries.
3. **Rubric decision** — 30-minute team call. Shapes `score_payload` and whether boolean+notes is enough.
4. **Split judged vs skipped in reporting** — header, completion banner, organizer-facing counts.
5. **Notes sync decoupled from marks** — debounced `POST` per (judge, project), requires identity.
6. **Deterministic sync key** — e.g. `client_id = hash(judgeId + streamId + projectId)` so DB upsert = current state, reconcile on `client_timestamp`.
7. **Server clock offset** — `GET /api/judging-config` returns `serverNow`; client applies delta alongside schedule offset.
8. **Cold-start failure UI** — clear retry screen when SSR fetch fails (minimum); service worker (stretch).
9. **Disable CTAs under prod mock banner** — prevent fake sync log entries.
10. **Vitest** — `format.ts`, `slots.ts`, offset + overtime boundaries. Cheap insurance before event night.

### Concrete schema ask for Tenzin (turn this into a PR / design doc)

```sql
-- Judge identity (lightweight)
judges (id, code UNIQUE, display_name)

-- What each judge actually sees
judge_assignments (judge_id, project_id, stream_id, slot_id)

-- Real schedule (replaces synthetic generator)
judging_slots (id, project_id, stream_id, room, starts_at, ends_at)

-- Authoritative current state per judge+project
judgments (
  judge_id, project_id, stream_id,
  action,          -- 'judged' | 'skipped' | 'unmarked'
  skip_reason,     -- nullable enum: absent | not_ready | wrong_track | ...
  notes,
  score_payload,   -- JSONB — shape TBD by rubric decision
  client_timestamp,
  PRIMARY KEY (judge_id, project_id, stream_id)
)
```

**Open product question (blocking):** Per-criterion scores, single 1–5 per track, or pairwise ranking?

### UX layer — credited as complete

The external review agrees the following are done and do not need another pass before schema work:

- Departure-board hero, graceful degradation, derived status
- Auto-advance, unmark, reset stream, per-stream storage
- Offline queue, schedule slip, sync badges
- Mobile schedule dock, keyboard shortcuts, break/live ribbons
- Production mock banner (warn only — disable CTAs still TODO)
- Inline action feedback (no Sonner/green toasts)

### Logistics

- Keep README and code in sync when fixing items above.
- Commit and push after each schema-aligned increment; branch on remote is `aly-judging`.
- Turn the [Proposed backend schema](#proposed-backend-schema-for-tenzin) section into a GitHub issue or PR description to force the rubric conversation this week.

---

*This document describes the full state of the judge portal as of July 4, 2026. If you change behavior, update this file.*
