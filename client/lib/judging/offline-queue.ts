import {
  loadLocalScheduleOffset,
  saveLocalScheduleOffset,
} from "./schedule-offset";
import { resolveJudgeId } from "./judge-identity";
import { judgmentSyncKey } from "./sync-key";
import type { SkipReason } from "./types";

export type JudgmentAction =
  | "reviewed"
  | "judged"
  | "skipped"
  | "unmarked"
  | "notes";

export type QueuedJudgment = {
  /** Deterministic: judgeId:streamId:projectId:r{round} */
  syncKey: string;
  judgeId: string;
  streamId: string;
  projectId: string;
  round: number;
  action: JudgmentAction;
  notes?: string;
  skipReason?: SkipReason | null;
  clientTimestamp: string;
};

export type PendingSummary = {
  total: number;
  marks: number;
  notesOnly: number;
};

export type ServerJudgmentRow = {
  project_id: string;
  action: string;
  skip_reason: string | null;
  notes: string | null;
  client_timestamp: string;
};

const QUEUE_KEY = "hc-judging-sync-queue";

function normalizeAction(action: JudgmentAction): JudgmentAction {
  return action === "judged" ? "reviewed" : action;
}

function normalizeQueueItem(raw: Partial<QueuedJudgment>): QueuedJudgment | null {
  if (!raw.streamId || !raw.projectId || !raw.action) return null;
  const judgeId = resolveJudgeId(raw.judgeId);
  const round = Number(raw.round ?? 1) || 1;
  const syncKey =
    raw.syncKey ?? judgmentSyncKey(judgeId, raw.streamId, raw.projectId, round);
  return {
    syncKey,
    judgeId,
    streamId: raw.streamId,
    projectId: raw.projectId,
    round,
    action: normalizeAction(raw.action as JudgmentAction),
    notes: raw.notes,
    skipReason: raw.skipReason,
    clientTimestamp: raw.clientTimestamp ?? new Date().toISOString(),
  };
}

function readQueue(): QueuedJudgment[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<QueuedJudgment>[];
    if (!Array.isArray(parsed)) return [];

    const byKey = new Map<string, QueuedJudgment>();
    for (const item of parsed) {
      const normalized = normalizeQueueItem(item);
      if (!normalized) continue;
      byKey.set(normalized.syncKey, normalized);
    }
    return [...byKey.values()];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedJudgment[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // quota
  }
}

export function getPendingCount(): number {
  return readQueue().length;
}

export function getPendingSummary(): PendingSummary {
  const queue = readQueue();
  const notesOnly = queue.filter((q) => q.action === "notes").length;
  return {
    total: queue.length,
    marks: queue.length - notesOnly,
    notesOnly,
  };
}

export function enqueueJudgment(
  item: Omit<QueuedJudgment, "syncKey" | "clientTimestamp" | "action" | "round"> & {
    action: JudgmentAction;
    round?: number;
    clientTimestamp?: string;
  }
) {
  const judgeId = resolveJudgeId(item.judgeId);
  const round = Number(item.round ?? 1) || 1;
  const action = normalizeAction(item.action);
  const syncKey = judgmentSyncKey(judgeId, item.streamId, item.projectId, round);
  const queue = readQueue();
  const prior = queue.find((q) => q.syncKey === syncKey);

  const entry: QueuedJudgment = {
    syncKey,
    judgeId,
    streamId: item.streamId,
    projectId: item.projectId,
    round,
    action,
    notes: item.notes !== undefined ? item.notes : prior?.notes,
    skipReason:
      action === "unmarked"
        ? null
        : item.skipReason !== undefined
          ? item.skipReason
          : prior?.skipReason,
    clientTimestamp: item.clientTimestamp ?? new Date().toISOString(),
  };

  writeQueue([...queue.filter((q) => q.syncKey !== syncKey), entry]);
  return syncKey;
}

/** Field-level merge: updates notes without replacing action. */
export function enqueueNotes(item: {
  judgeId: string;
  streamId: string;
  projectId: string;
  round?: number;
  notes: string;
}) {
  const judgeId = resolveJudgeId(item.judgeId);
  const round = Number(item.round ?? 1) || 1;
  const syncKey = judgmentSyncKey(judgeId, item.streamId, item.projectId, round);
  const queue = readQueue();
  const existing = queue.find((q) => q.syncKey === syncKey);
  if (existing) {
    existing.notes = item.notes;
    existing.clientTimestamp = new Date().toISOString();
    writeQueue(queue);
    return syncKey;
  }
  return enqueueJudgment({
    judgeId,
    streamId: item.streamId,
    projectId: item.projectId,
    round,
    action: "notes",
    notes: item.notes,
  });
}

export function dequeueSynced(syncKeys: string[]) {
  const set = new Set(syncKeys);
  writeQueue(readQueue().filter((q) => !set.has(q.syncKey)));
}

export function getQueue(): QueuedJudgment[] {
  return readQueue();
}

export type SyncResult =
  | { ok: true; syncedKeys: string[] }
  | { ok: false; reason: "offline" | "server" | "empty" };

export async function flushJudgmentQueue(): Promise<SyncResult> {
  const queue = readQueue();
  if (!queue.length) return { ok: true, syncedKeys: [] };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ok: false, reason: "offline" };
  }

  try {
    const res = await fetch("/api/judgments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: queue }),
    });
    if (!res.ok) return { ok: false, reason: "server" };
    const data = (await res.json()) as { syncedKeys?: string[] };
    const syncedKeys = data.syncedKeys ?? queue.map((q) => q.syncKey);
    dequeueSynced(syncedKeys);
    return { ok: true, syncedKeys };
  } catch {
    return { ok: false, reason: "server" };
  }
}

export async function syncNotesNow(item: {
  judgeId: string;
  streamId: string;
  projectId: string;
  round?: number;
  notes: string;
}) {
  const judgeId = resolveJudgeId(item.judgeId);
  const round = Number(item.round ?? 1) || 1;
  const syncKey = judgmentSyncKey(judgeId, item.streamId, item.projectId, round);

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueueNotes(item);
    return;
  }

  try {
    const res = await fetch("/api/judgments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            judgeId,
            streamId: item.streamId,
            projectId: item.projectId,
            round,
            action: "notes",
            notes: item.notes,
            clientTimestamp: new Date().toISOString(),
          },
        ],
      }),
    });
    if (res.ok) {
      const queue = readQueue();
      const existing = queue.find((q) => q.syncKey === syncKey);
      if (existing && existing.action !== "notes") {
        existing.notes = item.notes;
        existing.clientTimestamp = new Date().toISOString();
        writeQueue(queue);
      } else {
        writeQueue(queue.filter((q) => q.syncKey !== syncKey));
      }
      return;
    }
  } catch {
    // fall through to queue
  }

  enqueueNotes(item);
}

export async function fetchJudgmentsFromServer(options: {
  judgeId: string;
  streamId: string;
  round: number;
}): Promise<ServerJudgmentRow[]> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return [];
  const params = new URLSearchParams({
    judgeId: resolveJudgeId(options.judgeId),
    streamId: options.streamId,
    round: String(options.round),
  });
  try {
    const res = await fetch(`/api/judgments?${params}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: ServerJudgmentRow[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function fetchScheduleOffset(): Promise<number> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return loadLocalScheduleOffset();
  }
  try {
    const res = await fetch("/api/judging-config", { cache: "no-store" });
    if (!res.ok) return loadLocalScheduleOffset();
    const data = (await res.json()) as { scheduleOffsetMinutes?: number };
    const minutes = Number(data.scheduleOffsetMinutes ?? 0) || 0;
    saveLocalScheduleOffset(minutes);
    return minutes;
  } catch {
    return loadLocalScheduleOffset();
  }
}

export async function fetchJudgingConfig(): Promise<{
  scheduleOffsetMinutes: number;
  serverNow: string | null;
}> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      scheduleOffsetMinutes: loadLocalScheduleOffset(),
      serverNow: null,
    };
  }
  try {
    const res = await fetch("/api/judging-config", { cache: "no-store" });
    if (!res.ok) {
      return {
        scheduleOffsetMinutes: loadLocalScheduleOffset(),
        serverNow: null,
      };
    }
    const data = (await res.json()) as {
      scheduleOffsetMinutes?: number;
      serverNow?: string;
    };
    const minutes = Number(data.scheduleOffsetMinutes ?? 0) || 0;
    saveLocalScheduleOffset(minutes);
    return {
      scheduleOffsetMinutes: minutes,
      serverNow: data.serverNow ?? null,
    };
  } catch {
    return {
      scheduleOffsetMinutes: loadLocalScheduleOffset(),
      serverNow: null,
    };
  }
}
