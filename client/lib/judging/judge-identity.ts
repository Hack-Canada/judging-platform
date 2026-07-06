const JUDGE_CODE_KEY = "hc-judge-code";

/** Fallback when no ?code= in URL. Marks won't sync to a named judge on the server. */
export const ANONYMOUS_JUDGE_ID = "__anonymous__";

export function normalizeJudgeCode(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const code = raw.trim();
  if (!code) return null;
  return code.slice(0, 64);
}

export function loadJudgeCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(JUDGE_CODE_KEY);
    return normalizeJudgeCode(raw);
  } catch {
    return null;
  }
}

export function saveJudgeCode(code: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeJudgeCode(code);
  if (!normalized) return;
  try {
    localStorage.setItem(JUDGE_CODE_KEY, normalized);
  } catch {
    // ignore
  }
}

export function resolveJudgeId(code: string | null | undefined): string {
  return normalizeJudgeCode(code) ?? ANONYMOUS_JUDGE_ID;
}
