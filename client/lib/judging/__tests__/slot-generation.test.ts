import { describe, expect, it } from "vitest";
import { generateBoundedSyntheticSlots } from "../slot-generation";
import type { JudgingProject } from "../types";

function makeProjects(count: number, stream = "Maple Hall"): JudgingProject[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p-${i}`,
    name: `Project ${i}`,
    team: "Team",
    tracks: [stream],
    members: [],
    description: null,
    room: null,
  }));
}

describe("generateBoundedSyntheticSlots", () => {
  it("fits 200 projects inside a 3-hour window", () => {
    const blockStart = new Date("2026-06-01T14:00:00.000Z");
    const { slots, scheduleApproximate } = generateBoundedSyntheticSlots(
      makeProjects(200),
      { windowMinutes: 180, slotMinutes: 8, blockStart }
    );

    expect(slots).toHaveLength(200);
    expect(scheduleApproximate).toBe(true);

    const last = slots[slots.length - 1];
    const first = slots[0];
    const spanMs =
      new Date(last.startTime).getTime() - new Date(first.startTime).getTime();
    expect(spanMs).toBeLessThanOrEqual(180 * 60_000);
  });

  it("keeps full slot spacing for small lists", () => {
    const blockStart = new Date("2026-06-01T14:00:00.000Z");
    const { slots, scheduleApproximate } = generateBoundedSyntheticSlots(
      makeProjects(10),
      { windowMinutes: 180, slotMinutes: 8, blockStart }
    );

    expect(scheduleApproximate).toBe(false);
    const gap =
      new Date(slots[1].startTime).getTime() - new Date(slots[0].startTime).getTime();
    expect(gap).toBe(8 * 60_000);
  });
});
