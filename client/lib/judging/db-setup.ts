import { getSql } from "@/lib/db";
import type { NeonQueryFunction } from "@neondatabase/serverless";
let ensured = false;

async function migrateLegacySyncLog(sql: NeonQueryFunction<false, false>) {
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('judging_sync_log', 'judging_sync_log_legacy_client_id')
  `;
  const tableNames = new Set(tables.map((r) => r.table_name as string));
  if (!tableNames.has("judging_sync_log")) return;

  const columns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'judging_sync_log'
  `;
  const colNames = new Set(columns.map((r) => r.column_name as string));

  // v1 audit table used client_id PK; v2 uses judge_id + append-only BIGSERIAL id.
  if (colNames.has("client_id") && !colNames.has("judge_id")) {
    if (tableNames.has("judging_sync_log_legacy_client_id")) {
      await sql`DROP TABLE judging_sync_log`;
    } else {
      await sql`ALTER TABLE judging_sync_log RENAME TO judging_sync_log_legacy_client_id`;
    }
  }
}

async function migrateJudgmentsRound(sql: NeonQueryFunction<false, false>) {
  const columns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'judgments'
  `;
  const colNames = new Set(columns.map((r) => r.column_name as string));
  if (!colNames.has("round")) {
    await sql`ALTER TABLE judgments ADD COLUMN round INT NOT NULL DEFAULT 1`;
  }

  const pkCols = await sql`
    SELECT a.attname AS column_name
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'public.judgments'::regclass AND i.indisprimary
    ORDER BY array_position(i.indkey, a.attnum)
  `;
  const pk = pkCols.map((r) => r.column_name as string);
  if (!pk.includes("round")) {
    await sql`ALTER TABLE judgments DROP CONSTRAINT IF EXISTS judgments_pkey`;
    await sql`
      ALTER TABLE judgments ADD PRIMARY KEY (judge_id, stream_id, project_id, round)
    `;
  }

  const logCols = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'judging_sync_log'
  `;
  const logColNames = new Set(logCols.map((r) => r.column_name as string));
  if (!logColNames.has("round")) {
    await sql`ALTER TABLE judging_sync_log ADD COLUMN round INT NOT NULL DEFAULT 1`;
  }
}

/** Winner picks + optional ratings live on the same judgments row. */
async function migrateWinnerColumns(sql: NeonQueryFunction<false, false>) {
  await sql`
    ALTER TABLE judgments
      ADD COLUMN IF NOT EXISTS winner_pick BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS rating INT
  `;
  await sql`
    ALTER TABLE judging_sync_log
      ADD COLUMN IF NOT EXISTS winner_pick BOOLEAN,
      ADD COLUMN IF NOT EXISTS rating INT
  `;
}

/**
 * Sync store decision: `judgments` is the authoritative current-state read model
 * (PK: judge_id, stream_id, project_id). Reconcile on client_timestamp, not received_at.
 * `judging_sync_log` is append-only audit; never read for current state.
 */
export async function ensureJudgingTables() {
  if (ensured) return;
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS judging_event_config (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS judgments (
      judge_id TEXT NOT NULL,
      stream_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      round INT NOT NULL DEFAULT 1,
      action TEXT NOT NULL,
      skip_reason TEXT,
      notes TEXT,
      client_timestamp TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (judge_id, stream_id, project_id, round)
    )
  `;

  await migrateJudgmentsRound(sql);

  await migrateLegacySyncLog(sql);

  await sql`
    CREATE TABLE IF NOT EXISTS judging_sync_log (
      id BIGSERIAL PRIMARY KEY,
      judge_id TEXT NOT NULL,
      stream_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      round INT NOT NULL DEFAULT 1,
      action TEXT NOT NULL,
      skip_reason TEXT,
      notes TEXT,
      client_timestamp TIMESTAMPTZ NOT NULL,
      received_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await migrateWinnerColumns(sql);

  ensured = true;
}

export async function getScheduleOffsetMinutes(): Promise<number> {
  if (!process.env.DATABASE_URL) {
    return Number(process.env.JUDGING_SCHEDULE_OFFSET_MINUTES ?? 0) || 0;
  }
  try {
    await ensureJudgingTables();
    const sql = getSql();
    const rows = await sql`
      SELECT value FROM judging_event_config WHERE key = 'schedule'
    `;
    const value = rows[0]?.value as { scheduleOffsetMinutes?: number } | undefined;
    return Number(value?.scheduleOffsetMinutes ?? 0) || 0;
  } catch {
    return Number(process.env.JUDGING_SCHEDULE_OFFSET_MINUTES ?? 0) || 0;
  }
}

/** Persist absolute schedule offset for judges (positive = running behind). */
export async function setScheduleOffsetMinutes(minutes: number): Promise<number> {
  const next = Number.isFinite(minutes) ? Math.round(minutes) : 0;
  if (!process.env.DATABASE_URL) {
    return next;
  }
  await ensureJudgingTables();
  const sql = getSql();
  const payload = JSON.stringify({ scheduleOffsetMinutes: next });
  await sql`
    INSERT INTO judging_event_config (key, value, updated_at)
    VALUES ('schedule', ${payload}::jsonb, now())
    ON CONFLICT (key) DO UPDATE
    SET value = ${payload}::jsonb, updated_at = now()
  `;
  return next;
}

/** Add minutes to the current judging schedule offset. */
export async function bumpScheduleOffsetMinutes(deltaMinutes: number): Promise<number> {
  const current = await getScheduleOffsetMinutes();
  return setScheduleOffsetMinutes(current + deltaMinutes);
}

export function getServerNowIso(): string {
  return new Date().toISOString();
}
