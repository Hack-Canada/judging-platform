import { describe, expect, it } from "vitest";
import {
  deriveSlotStatus,
  formatRelativeUntil,
  getTimeRemaining,
  parseLocation,
} from "../format";

describe("deriveSlotStatus", () => {
  const start = "2026-06-25T14:00:00.000Z";
  const end = "2026-06-25T14:25:00.000Z";

  it("returns upcoming before start", () => {
    const at = new Date(start).getTime() - 1;
    expect(deriveSlotStatus(start, end, at)).toBe("upcoming");
  });

  it("returns live exactly at start", () => {
    const at = new Date(start).getTime();
    expect(deriveSlotStatus(start, end, at)).toBe("live");
  });

  it("returns live before end", () => {
    const at = new Date(end).getTime() - 1;
    expect(deriveSlotStatus(start, end, at)).toBe("live");
  });

  it("returns done exactly at end", () => {
    const at = new Date(end).getTime();
    expect(deriveSlotStatus(start, end, at)).toBe("done");
  });

  it("returns done after end", () => {
    const at = new Date(end).getTime() + 60_000;
    expect(deriveSlotStatus(start, end, at)).toBe("done");
  });
});

describe("getTimeRemaining", () => {
  const end = "2026-06-25T14:25:00.000Z";

  it("counts down before end", () => {
    const at = new Date(end).getTime() - 90_000;
    const result = getTimeRemaining(end, at);
    expect(result.overtime).toBe(false);
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(30);
    expect(result.label).toBe("1:30");
  });

  it("handles overtime", () => {
    const at = new Date(end).getTime() + 65_000;
    const result = getTimeRemaining(end, at);
    expect(result.overtime).toBe(true);
    expect(result.overtimeSeconds).toBe(65);
    expect(result.label).toBe("+1:05");
  });

  it("handles exactly at end", () => {
    const at = new Date(end).getTime();
    const result = getTimeRemaining(end, at);
    expect(result.overtime).toBe(true);
    expect(result.overtimeSeconds).toBeGreaterThanOrEqual(0);
  });
});

describe("formatRelativeUntil", () => {
  it("returns now when past", () => {
    expect(formatRelativeUntil("2020-01-01T00:00:00.000Z", Date.now())).toBe("now");
  });

  it("returns minutes when under an hour", () => {
    const at = Date.parse("2026-06-25T14:00:00.000Z");
    const target = "2026-06-25T14:10:00.000Z";
    expect(formatRelativeUntil(target, at)).toBe("in 10 min");
  });
});

describe("parseLocation", () => {
  it("parses venue and table with middle dot", () => {
    const result = parseLocation("Maple Hall · Table 12");
    expect(result.venue).toBe("Maple Hall");
    expect(result.tableNumber).toBe("12");
  });

  it("parses inline table reference", () => {
    const result = parseLocation("Main floor Table 3");
    expect(result.tableNumber).toBe("3");
  });

  it("returns full string as venue when no table", () => {
    const result = parseLocation("Lobby");
    expect(result.venue).toBe("Lobby");
    expect(result.tableNumber).toBeNull();
  });
});
