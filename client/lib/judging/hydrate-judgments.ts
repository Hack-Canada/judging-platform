import type { ServerJudgmentRow } from "./offline-queue";
import type { JudgingStorage, SkipReason } from "./types";

const SKIP_REASONS = new Set<SkipReason>(["absent", "not_ready", "wrong_track"]);

function asSkipReason(raw: string | null): SkipReason | undefined {
  if (raw && SKIP_REASONS.has(raw as SkipReason)) return raw as SkipReason;
  return undefined;
}

/** Map authoritative server rows into portal storage fields. */
export function serverRowsToStorage(rows: ServerJudgmentRow[]): Pick<
  JudgingStorage,
  "judgedIds" | "skippedIds" | "skipReasons" | "notes"
> {
  const judgedSet = new Set<string>();
  const skippedSet = new Set<string>();
  const skipReasons: Record<string, SkipReason> = {};
  const notes: Record<string, string> = {};

  for (const row of rows) {
    const id = row.project_id;
    const action = row.action;

    if (row.notes) notes[id] = row.notes;

    if (action === "notes" || action === "unmarked") continue;

    if (action === "skipped") {
      judgedSet.add(id);
      skippedSet.add(id);
      const reason = asSkipReason(row.skip_reason);
      if (reason) skipReasons[id] = reason;
      continue;
    }

    if (
      action === "reviewed" ||
      action === "judged" ||
      // Legacy rows from an earlier multi-round prototype
      action === "advance_yes" ||
      action === "advance_no"
    ) {      judgedSet.add(id);
    }
  }

  return {
    judgedIds: [...judgedSet],
    skippedIds: [...skippedSet],
    skipReasons,
    notes,
  };
}

export function mergeStorageWithServer(
  local: JudgingStorage,
  fromServer: ReturnType<typeof serverRowsToStorage>
): JudgingStorage {
  const judgedIds = new Set([...local.judgedIds, ...fromServer.judgedIds]);
  const skippedIds = new Set([...local.skippedIds, ...fromServer.skippedIds]);
  return {
    judgedIds: [...judgedIds],
    skippedIds: [...skippedIds],
    skipReasons: { ...fromServer.skipReasons, ...local.skipReasons },
    notes: { ...fromServer.notes, ...local.notes },
    earlyMarkedIds: local.earlyMarkedIds,
  };
}
