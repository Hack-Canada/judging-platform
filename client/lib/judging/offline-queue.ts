import {
  loadLocalScheduleOffset,
  saveLocalScheduleOffset,
} from "./schedule-offset";
import { resolveJudgeId } from "./judge-identity";
import { judgmentSyncKey } from "./sync-key";
import type { SkipReason } from "./types";

export type JudgmentAction = "judged" | "skipped" | "unmarked" | "notes";

export type QueuedJudgment = {
  /** Deterministic: judgeId:streamId:projectId */
  syncKey: string;
  judgeId: string;
  streamId: string;
  projectId: string;
  action: JudgmentAction;
  notes?: string;
  skipReason?: SkipReason | null;
  clientTimestamp: string;
};

const QUEUE_KEY = "hc-judging-sync-queue";

function readQueue(): QueuedJudgment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedJudgment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedJudgment[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // quota
  }
}

export function getPendingCount(): number {
  return readQueue().length;
}

export function enqueueJudgment(
  item: Omit<QueuedJudgment, "syncKey" | "clientTimestamp"> & {
    clientTimestamp?: string;
  }
) {
  const judgeId = resolveJudgeId(item.judgeId);
  const syncKey = judgmentSyncKey(judgeId, item.streamId, item.projectId);
  const entry: QueuedJudgment = {
    syncKey,
    judgeId,
    streamId: item.streamId,
    projectId: item.projectId,
    action: item.action,
    notes: item.notes,
    skipReason: item.skipReason,
    clientTimestamp: item.clientTimestamp ?? new Date().toISOString(),
  };

  const filtered = readQueue().filter((q) => q.syncKey !== syncKey);
  filtered.push(entry);
  writeQueue(filtered);
  return syncKey;
}

/** Merge notes into an existing queue row or enqueue a notes-only item. */
export function enqueueNotes(item: {
  judgeId: string;
  streamId: string;
  projectId: string;
  notes: string;
}) {
  const judgeId = resolveJudgeId(item.judgeId);
  const syncKey = judgmentSyncKey(judgeId, item.streamId, item.projectId);
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
  notes: string;
}) {
  enqueueNotes(item);

  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  try {
    await fetch("/api/judgments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            judgeId: resolveJudgeId(item.judgeId),
            streamId: item.streamId,
            projectId: item.projectId,
            action: "notes",
            notes: item.notes,
            clientTimestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {
    // best-effort; queue holds the update for next flush
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
    return { scheduleOffsetMinutes: loadLocalScheduleOffset(), serverNow: null };
  }
  try {
    const res = await fetch("/api/judging-config", { cache: "no-store" });
    if (!res.ok) {
      return { scheduleOffsetMinutes: loadLocalScheduleOffset(), serverNow: null };
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
    return { scheduleOffsetMinutes: loadLocalScheduleOffset(), serverNow: null };
  }
}

export async function publishScheduleOffset(minutes: number, organizerKey?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (organizerKey) headers["x-organizer-key"] = organizerKey;

  const res = await fetch("/api/judging-config", {
    method: "POST",
    headers,
    body: JSON.stringify({ scheduleOffsetMinutes: minutes }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not save schedule offset");
  }
  const data = (await res.json()) as { scheduleOffsetMinutes: number };
  saveLocalScheduleOffset(data.scheduleOffsetMinutes);
  return data.scheduleOffsetMinutes;
}
