import type { JudgingStorage } from "./types";

const STORAGE_PREFIX = "hc-judging-v2";
const LEGACY_KEY = "hc-judging-v1";

const EMPTY: JudgingStorage = {
  judgedIds: [],
  skippedIds: [],
  skipReasons: {},
  notes: {},
  earlyMarkedIds: [],
};

export function storageKeyForStream(streamId: string): string {
  return `${STORAGE_PREFIX}:${streamId}`;
}

export function loadJudgingStorage(streamId: string): JudgingStorage {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(storageKeyForStream(streamId));
    if (raw) {
      return parseStorage(raw);
    }

    // One-time migration from global v1 key into the first stream the judge opens.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = parseStorage(legacy);
      saveJudgingStorage(streamId, migrated);
      localStorage.removeItem(LEGACY_KEY);
      return migrated;
    }

    return EMPTY;
  } catch {
    return EMPTY;
  }
}

function parseStorage(raw: string): JudgingStorage {
  const parsed = JSON.parse(raw) as Partial<JudgingStorage>;
  return {
    judgedIds: Array.isArray(parsed.judgedIds) ? parsed.judgedIds : [],
    skippedIds: Array.isArray(parsed.skippedIds) ? parsed.skippedIds : [],
    skipReasons:
      parsed.skipReasons && typeof parsed.skipReasons === "object"
        ? (parsed.skipReasons as JudgingStorage["skipReasons"])
        : {},
    notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
    earlyMarkedIds: Array.isArray(parsed.earlyMarkedIds) ? parsed.earlyMarkedIds : [],
  };
}

export function saveJudgingStorage(streamId: string, data: JudgingStorage) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKeyForStream(streamId), JSON.stringify(data));
  } catch {
    // quota / private mode — fail silently
  }
}

export function clearJudgingStorage(streamId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKeyForStream(streamId));
  } catch {
    // ignore
  }
}
