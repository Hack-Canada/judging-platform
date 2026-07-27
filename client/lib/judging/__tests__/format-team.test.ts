import { describe, expect, it } from "vitest";
import { formatTeamLabel } from "../format";
import type { JudgingProject } from "../types";

const base: JudgingProject = {
  id: "1",
  name: "Test",
  team: "Syed",
  tracks: [],
  members: [],
  description: null,
  room: null,
};

describe("formatTeamLabel", () => {
  it("joins all members when present", () => {
    expect(
      formatTeamLabel({
        ...base,
        members: ["Akash Nagabhirava", "Sehreen Basara", "Seeron Sivashankar"],
        team: "Akash",
      })
    ).toBe("Akash Nagabhirava, Sehreen Basara, Seeron Sivashankar");
  });

  it("falls back to team when no members", () => {
    expect(formatTeamLabel({ ...base, team: "Syed Ahmed" })).toBe("Syed Ahmed");
  });
});
