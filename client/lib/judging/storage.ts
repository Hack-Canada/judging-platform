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

export function storageKeyForStream(streamId: string, round = 1): string {
  return `${STORAGE_PREFIX}:${streamId}:r${round}`;
}

export function loadJudgingStorage(streamId: string, round = 1): JudgingStorage {
  if (typeof window === "undefined") return EMPTY;
  try {
    const keyed = localStorage.getItem(storageKeyForStream(streamId, round));
    if (keyed) {
      return parseStorage(keyed);
    }

    // Migrate legacy stream-only key (pre-round) once.
    if (round === 1) {
      const legacyStream = localStorage.getItem(`${STORAGE_PREFIX}:${streamId}`);
      if (legacyStream) {
        const migrated = parseStorage(legacyStream);
        saveJudgingStorage(streamId, migrated, 1);
        localStorage.removeItem(`${STORAGE_PREFIX}:${streamId}`);
        return migrated;
      }
    }

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = parseStorage(legacy);
      saveJudgingStorage(streamId, migrated, round);
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

export function saveJudgingStorage(streamId: string, data: JudgingStorage, round = 1) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKeyForStream(streamId, round), JSON.stringify(data));
  } catch {
    // quota / private mode — fail silently
  }
}

export function clearJudgingStorage(streamId: string, round = 1) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKeyForStream(streamId, round));
  } catch {
    // ignore
  }
}
