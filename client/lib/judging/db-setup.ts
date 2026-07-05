import { getSql } from "@/lib/db";

let ensured = false;

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
      action TEXT NOT NULL,
      skip_reason TEXT,
      notes TEXT,
      client_timestamp TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (judge_id, stream_id, project_id)
    )
  `;

  await sql`
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
    )
  `;

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

export async function setScheduleOffsetMinutes(minutes: number): Promise<number> {
  await ensureJudgingTables();
  const sql = getSql();
  const clamped = Math.max(-180, Math.min(180, Math.round(minutes)));
  await sql`
    INSERT INTO judging_event_config (key, value, updated_at)
    VALUES ('schedule', ${JSON.stringify({ scheduleOffsetMinutes: clamped })}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = now()
  `;
  return clamped;
}

export function getServerNowIso(): string {
  return new Date().toISOString();
}
