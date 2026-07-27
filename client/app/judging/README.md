# Judge portal (`/judging`)

In-person judging desk for HackCanada. Judges review projects in a locked track, mark reviewed or skip, and optionally leave notes. Votes sync to Neon when online.

## Judge link

Share one private URL per judge and stream:

```
/judging?code=J42&stream=google-build-with-ai-track
```

| Param | Required | Purpose |
|-------|----------|---------|
| `code` | Yes (for sync) | Judge identity stamped on every vote |
| `stream` | Yes (recommended) | Locks the judge to one track — stream tabs hidden |
| `projects` | No | Comma-separated project IDs — client-only assignment filter |

Example: `/judging?code=J42&stream=google-build-with-ai-track&projects=abc,def`

## Flow

1. Open link → project hero + session rail
2. **Mark reviewed** or **Skip** (optional reason)
3. Auto-advances to next unreviewed project
4. Notes debounce-sync to `judgments.notes`

No login, no organizer UI, no multi-round voting.

## Data

- **Projects** — `projects` table in Neon (requires `DATABASE_URL`)
- **Votes** — `judgments` table (`action`: `reviewed`, `skipped`, `unmarked`, `notes`)
- **Offline** — localStorage queue flushes via `POST /api/judgments`

## Env

```bash
DATABASE_URL=postgresql://...
JUDGING_SCHEDULE_OFFSET_MINUTES=0   # Optional; shifts displayed slot times
```

Schedule offset also lives in `judging_event_config` key `schedule`. Organizers set it from **Admin → Schedule → Judges running behind**. Judges poll `/api/judging-config` about every 10s so the delay appears without a refresh.

## API

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/judgments` | GET | Hydrate judge state for stream + round |
| `/api/judgments` | POST | Upsert marks / notes |
| `/api/judging-config` | GET | Schedule offset + server clock |
| `/api/judging-config` | PATCH | Organizer sets schedule offset (`scheduleOffsetMinutes` or `addMinutes`) |

## Key files

```
app/judging/
  page.tsx              Server load + search params
  judging-portal.tsx    Main client orchestrator
  judging.css           Scoped --j-* tokens

components/judging/     UI (header, footer, rail, spotlight, notes, …)

lib/judging/
  get-data.ts           Projects, streams, slots from DB
  offline-queue.ts      Sync queue + flush
  storage.ts            Per-stream localStorage
  slots.ts              Live/upcoming/done derivation
```

## Tests

```bash
cd client && npm test
```

Coverage: format, slots, streams, slot-generation, offline-queue.

## Querying results

There is no in-app results dashboard. Tally votes in SQL, e.g.:

```sql
SELECT stream_id, action, COUNT(*)
FROM judgments
WHERE round = 1
GROUP BY stream_id, action;
```
