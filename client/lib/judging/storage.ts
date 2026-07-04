import type { JudgingStorage } from "./types";

const STORAGE_KEY = "hc-judging-v1";

const EMPTY: JudgingStorage = { judgedIds: [], skippedIds: [], notes: {} };

export function loadJudgingStorage(): JudgingStorage {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<JudgingStorage>;
    return {
      judgedIds: Array.isArray(parsed.judgedIds) ? parsed.judgedIds : [],
      skippedIds: Array.isArray(parsed.skippedIds) ? parsed.skippedIds : [],
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
    };
  } catch {
    return EMPTY;
  }
}

export function saveJudgingStorage(data: JudgingStorage) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota / private mode — fail silently
  }
}
