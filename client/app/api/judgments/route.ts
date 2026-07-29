import { ensureJudgingTables } from "@/lib/judging/db-setup";
import { getSql } from "@/lib/db";

type SyncItem = {
  syncKey?: string;
  judgeId: string;
  streamId: string;
  projectId: string;
  round?: number;
  action: string;
  notes?: string;
  skipReason?: string | null;
  winner?: boolean;
  rating?: number | null;
  clientTimestamp: string;
};

function itemRating(item: SyncItem): number | null {
  if (item.rating === null || item.rating === undefined) return null;
  const n = Math.round(Number(item.rating));
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return n;
}

function itemRound(item: SyncItem): number {
  const n = Number(item.round ?? 1);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function itemSyncKey(item: SyncItem): string {
  const round = itemRound(item);
  return item.syncKey ?? `${item.judgeId}:${item.streamId}:${item.projectId}:r${round}`;
}

/** Hydrate judge state for a stream + round from authoritative judgments table. */
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ items: [] });
  }

  const url = new URL(request.url);
  const judgeId = url.searchParams.get("judgeId")?.trim();
  const streamId = url.searchParams.get("streamId")?.trim();
  const round = Math.max(1, Math.floor(Number(url.searchParams.get("round") ?? 1)));

  if (!judgeId || !streamId) {
    return Response.json({ error: "judgeId and streamId are required" }, { status: 400 });
  }

  try {
    await ensureJudgingTables();
    const sql = getSql();
    const rows = await sql`
      SELECT project_id, action, skip_reason, notes, winner_pick, rating, client_timestamp
      FROM judgments
      WHERE judge_id = ${judgeId}
        AND stream_id = ${streamId}
        AND round = ${round}
    `;
    return Response.json({ items: rows });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load judgments" },
      { status: 500 }
    );
  }
}

/**
 * Authoritative store: `judgments` (composite PK incl. round).
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
        syncedKeys: items.map((i) => itemSyncKey(i)),
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

      const round = itemRound(item);
      const syncKey = itemSyncKey(item);

      if (item.action === "notes") {
        await sql`
          INSERT INTO judgments (
            judge_id, stream_id, project_id, round, action, skip_reason, notes, client_timestamp
          ) VALUES (
            ${item.judgeId},
            ${item.streamId},
            ${item.projectId},
            ${round},
            'notes',
            NULL,
            ${item.notes ?? null},
            ${item.clientTimestamp}
          )
          ON CONFLICT (judge_id, stream_id, project_id, round) DO UPDATE SET
            notes = EXCLUDED.notes,
            client_timestamp = EXCLUDED.client_timestamp,
            updated_at = now()
          WHERE judgments.client_timestamp <= EXCLUDED.client_timestamp
        `;
      } else if (item.action === "winner") {
        // Field-level update: never clobbers the review/skip action.
        await sql`
          INSERT INTO judgments (
            judge_id, stream_id, project_id, round, action, skip_reason, notes, winner_pick, client_timestamp
          ) VALUES (
            ${item.judgeId},
            ${item.streamId},
            ${item.projectId},
            ${round},
            'winner',
            NULL,
            ${item.notes ?? null},
            ${item.winner ?? false},
            ${item.clientTimestamp}
          )
          ON CONFLICT (judge_id, stream_id, project_id, round) DO UPDATE SET
            winner_pick = EXCLUDED.winner_pick,
            client_timestamp = EXCLUDED.client_timestamp,
            updated_at = now()
          WHERE judgments.client_timestamp <= EXCLUDED.client_timestamp
        `;
      } else if (item.action === "rating") {
        await sql`
          INSERT INTO judgments (
            judge_id, stream_id, project_id, round, action, skip_reason, notes, rating, client_timestamp
          ) VALUES (
            ${item.judgeId},
            ${item.streamId},
            ${item.projectId},
            ${round},
            'rating',
            NULL,
            ${item.notes ?? null},
            ${itemRating(item)},
            ${item.clientTimestamp}
          )
          ON CONFLICT (judge_id, stream_id, project_id, round) DO UPDATE SET
            rating = EXCLUDED.rating,
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
            AND round = ${round}
            AND client_timestamp <= ${item.clientTimestamp}
        `;
      } else {
        await sql`
          INSERT INTO judgments (
            judge_id, stream_id, project_id, round, action, skip_reason, notes, winner_pick, rating, client_timestamp
          ) VALUES (
            ${item.judgeId},
            ${item.streamId},
            ${item.projectId},
            ${round},
            ${item.action},
            ${item.skipReason ?? null},
            ${item.notes ?? null},
            ${item.winner ?? false},
            ${itemRating(item)},
            ${item.clientTimestamp}
          )
          ON CONFLICT (judge_id, stream_id, project_id, round) DO UPDATE SET
            action = EXCLUDED.action,
            skip_reason = EXCLUDED.skip_reason,
            notes = COALESCE(EXCLUDED.notes, judgments.notes),
            winner_pick = COALESCE(${item.winner ?? null}::boolean, judgments.winner_pick),
            rating = COALESCE(${itemRating(item)}::int, judgments.rating),
            client_timestamp = EXCLUDED.client_timestamp,
            updated_at = now()
          WHERE judgments.client_timestamp <= EXCLUDED.client_timestamp
        `;
      }

      await sql`
        INSERT INTO judging_sync_log (
          judge_id, stream_id, project_id, round, action, skip_reason, notes, winner_pick, rating, client_timestamp
        ) VALUES (
          ${item.judgeId},
          ${item.streamId},
          ${item.projectId},
          ${round},
          ${item.action},
          ${item.skipReason ?? null},
          ${item.notes ?? null},
          ${item.winner ?? null},
          ${itemRating(item)},
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
