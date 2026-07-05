import { describe, expect, it } from "vitest";
import { applyScheduleOffset } from "../schedule-offset";
import {
  findBreakState,
  getNextUnjudgedProjectId,
  pickPrimarySlot,
  streamProgress,
  withDerivedStatus,
} from "../slots";
import type { JudgingSlot } from "../types";

function slot(
  id: string,
  projectId: string,
  start: string,
  end: string,
  streamId = "s1"
): JudgingSlot {
  return { id, projectId, streamId, startTime: start, endTime: end, room: null };
}

describe("withDerivedStatus", () => {
  it("derives status from timestamps", () => {
    const slots = [
      slot("1", "p1", "2026-06-25T14:00:00.000Z", "2026-06-25T14:25:00.000Z"),
    ];
    const at = Date.parse("2026-06-25T14:10:00.000Z");
    const result = withDerivedStatus(slots, at);
    expect(result[0].status).toBe("live");
  });

  it("applies clock delta via adjusted at", () => {
    const slots = [
      slot("1", "p1", "2026-06-25T14:00:00.000Z", "2026-06-25T14:25:00.000Z"),
    ];
    const deviceNow = Date.parse("2026-06-25T13:50:00.000Z");
    const serverDeltaMs = 15 * 60_000;
    const result = withDerivedStatus(slots, deviceNow + serverDeltaMs);
    expect(result[0].status).toBe("live");
  });
});

describe("streamProgress", () => {
  const slots = [
    slot("1", "p1", "2026-06-25T14:00:00.000Z", "2026-06-25T14:25:00.000Z"),
    slot("2", "p2", "2026-06-25T14:25:00.000Z", "2026-06-25T14:50:00.000Z"),
    slot("3", "p3", "2026-06-25T14:50:00.000Z", "2026-06-25T15:15:00.000Z"),
  ];

  it("counts judged excluding skips", () => {
    const judged = new Set(["p1", "p2"]);
    const skipped = new Set(["p2"]);
    const result = streamProgress(slots, judged, skipped);
    expect(result.judged).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.total).toBe(3);
    expect(result.remaining).toBe(1);
  });

  it("remaining uses judgedIds including skips", () => {
    const judged = new Set(["p1", "p2"]);
    const skipped = new Set(["p2"]);
    expect(streamProgress(slots, judged, skipped).remaining).toBe(1);
  });
});

describe("getNextUnjudgedProjectId", () => {
  const slots = [
    slot("1", "p1", "2026-06-25T14:00:00.000Z", "2026-06-25T14:25:00.000Z"),
    slot("2", "p2", "2026-06-25T14:25:00.000Z", "2026-06-25T14:50:00.000Z"),
  ];

  it("skips judged and excluded project", () => {
    const judged = new Set(["p1"]);
    expect(getNextUnjudgedProjectId(slots, judged, "p1")).toBe("p2");
  });
});

describe("findBreakState", () => {
  it("returns null when a live slot exists", () => {
    const slots = withDerivedStatus(
      [
        slot("1", "p1", "2026-06-25T14:00:00.000Z", "2026-06-25T14:25:00.000Z"),
        slot("2", "p2", "2026-06-25T15:00:00.000Z", "2026-06-25T15:25:00.000Z"),
      ],
      Date.parse("2026-06-25T14:10:00.000Z")
    );
    expect(findBreakState(slots, new Set(), Date.parse("2026-06-25T14:10:00.000Z"))).toBeNull();
  });
});

describe("pickPrimarySlot", () => {
  it("returns undefined for zero slots", () => {
    expect(pickPrimarySlot([])).toBeUndefined();
  });

  it("prefers live slot among multiples", () => {
    const slots = [
      slot("1", "p1", "2026-06-25T14:00:00.000Z", "2026-06-25T14:25:00.000Z"),
      slot("2", "p1", "2026-06-25T15:00:00.000Z", "2026-06-25T15:25:00.000Z"),
    ];
    const at = Date.parse("2026-06-25T14:10:00.000Z");
    expect(pickPrimarySlot(slots, at)?.id).toBe("1");
  });
});

describe("schedule offset with derived status", () => {
  it("shifts slot times before deriving status", () => {
    const slots = [
      slot("1", "p1", "2026-06-25T14:00:00.000Z", "2026-06-25T14:25:00.000Z"),
    ];
    const offset = applyScheduleOffset(slots, 10);
    const at = Date.parse("2026-06-25T14:15:00.000Z");
    const result = withDerivedStatus(offset, at);
    expect(result[0].status).toBe("live");
  });
});
