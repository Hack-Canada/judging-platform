import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  enqueueJudgment,
  enqueueNotes,
  getPendingCount,
  getPendingSummary,
  getQueue,
} from "../offline-queue";

const store: Record<string, string> = {};

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  });
  for (const key of Object.keys(store)) delete store[key];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("enqueueJudgment dedup", () => {
  it("collapses judged, skip, and unmark on one syncKey to a single row", () => {
    const base = {
      judgeId: "J42",
      streamId: "s1",
      projectId: "p1",
    };

    enqueueJudgment({ ...base, action: "reviewed", notes: "solid" });
    expect(getPendingCount()).toBe(1);

    enqueueJudgment({ ...base, action: "skipped", skipReason: "absent" });
    expect(getPendingCount()).toBe(1);
    expect(getQueue()[0].action).toBe("skipped");

    enqueueJudgment({ ...base, action: "unmarked" });
    expect(getPendingCount()).toBe(1);
    expect(getQueue()[0].action).toBe("unmarked");
  });

  it("keeps separate rows per project", () => {
    for (let i = 0; i < 4; i++) {
      enqueueJudgment({
        judgeId: "J42",
        streamId: "s1",
        projectId: `p${i}`,
        action: "skipped",
      });
    }
    expect(getPendingCount()).toBe(4);
  });
});

describe("notes merge", () => {
  it("merges notes into an existing mark row without changing action", () => {
    enqueueJudgment({
      judgeId: "J42",
      streamId: "s1",
      projectId: "p1",
      action: "reviewed",
    });
    enqueueNotes({
      judgeId: "J42",
      streamId: "s1",
      projectId: "p1",
      notes: "great demo",
    });

    expect(getPendingCount()).toBe(1);
    const row = getQueue()[0];
    expect(row.action).toBe("reviewed");
    expect(row.notes).toBe("great demo");
  });

  it("preserves notes through unmark when notes not re-sent", () => {
    enqueueJudgment({
      judgeId: "J42",
      streamId: "s1",
      projectId: "p1",
      action: "reviewed",
      notes: "keep this",
    });
    enqueueJudgment({
      judgeId: "J42",
      streamId: "s1",
      projectId: "p1",
      action: "unmarked",
    });

    expect(getQueue()[0].notes).toBe("keep this");
    expect(getQueue()[0].action).toBe("unmarked");
  });
});

describe("getPendingSummary", () => {
  it("separates marks from notes-only rows", () => {
    enqueueJudgment({
      judgeId: "J42",
      streamId: "s1",
      projectId: "p1",
      action: "skipped",
    });
    enqueueNotes({
      judgeId: "J42",
      streamId: "s1",
      projectId: "p2",
      notes: "draft",
    });

    expect(getPendingSummary()).toEqual({ total: 2, marks: 1, notesOnly: 1 });
  });
});
