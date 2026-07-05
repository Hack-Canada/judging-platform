import { ensureJudgingTables } from "@/lib/judging/db-setup";
import { getSql } from "@/lib/db";

type SyncItem = {
  syncKey?: string;
  judgeId: string;
  streamId: string;
  projectId: string;
  action: string;
  notes?: string;
  skipReason?: string | null;
  clientTimestamp: string;
};

/**
 * Authoritative store: `judgments` (composite PK).
 * Upserts only when incoming client_timestamp >= existing row (offline retries may arrive out of order).
 * judging_sync_log is append-only audit, never read for state.
 */
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    try {
      const body = (await request.json()) as { items?: SyncItem[] };
      const items = body.items ?? [];
      return Response.json({
        ok: true,
        syncedKeys: items.map(
          (i) => i.syncKey ?? `${i.judgeId}:${i.streamId}:${i.projectId}`
        ),
      });
    } catch {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }
  }

  try {
    const body = (await request.json()) as { items?: SyncItem[] };
    const items = body.items ?? [];
    if (!items.length) {
      return Response.json({ ok: true, syncedKeys: [] });
    }

    await ensureJudgingTables();
    const sql = getSql();
    const syncedKeys: string[] = [];

    for (const item of items) {
      if (!item.judgeId || !item.streamId || !item.projectId || !item.action) continue;

      const syncKey =
        item.syncKey ?? `${item.judgeId}:${item.streamId}:${item.projectId}`;

      if (item.action === "notes") {
        await sql`
          INSERT INTO judgments (
            judge_id, stream_id, project_id, action, skip_reason, notes, client_timestamp
          ) VALUES (
            ${item.judgeId},
            ${item.streamId},
            ${item.projectId},
            'notes',
            NULL,
            ${item.notes ?? null},
            ${item.clientTimestamp}
          )
          ON CONFLICT (judge_id, stream_id, project_id) DO UPDATE SET
            notes = EXCLUDED.notes,
            client_timestamp = EXCLUDED.client_timestamp,
            updated_at = now()
          WHERE judgments.client_timestamp <= EXCLUDED.client_timestamp
        `;
      } else if (item.action === "unmarked") {
        await sql`
          DELETE FROM judgments
          WHERE judge_id = ${item.judgeId}
            AND stream_id = ${item.streamId}
            AND project_id = ${item.projectId}
            AND client_timestamp <= ${item.clientTimestamp}
        `;
      } else {
        await sql`
          INSERT INTO judgments (
            judge_id, stream_id, project_id, action, skip_reason, notes, client_timestamp
          ) VALUES (
            ${item.judgeId},
            ${item.streamId},
            ${item.projectId},
            ${item.action},
            ${item.skipReason ?? null},
            ${item.notes ?? null},
            ${item.clientTimestamp}
          )
          ON CONFLICT (judge_id, stream_id, project_id) DO UPDATE SET
            action = EXCLUDED.action,
            skip_reason = EXCLUDED.skip_reason,
            notes = COALESCE(EXCLUDED.notes, judgments.notes),
            client_timestamp = EXCLUDED.client_timestamp,
            updated_at = now()
          WHERE judgments.client_timestamp <= EXCLUDED.client_timestamp
        `;
      }

      await sql`
        INSERT INTO judging_sync_log (
          judge_id, stream_id, project_id, action, skip_reason, notes, client_timestamp
        ) VALUES (
          ${item.judgeId},
          ${item.streamId},
          ${item.projectId},
          ${item.action},
          ${item.skipReason ?? null},
          ${item.notes ?? null},
          ${item.clientTimestamp}
        )
      `;

      syncedKeys.push(syncKey);
    }

    return Response.json({ ok: true, syncedKeys });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
