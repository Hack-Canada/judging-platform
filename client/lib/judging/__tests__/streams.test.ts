import { describe, expect, it } from "vitest";
import { buildStreamsFromProjects, filterProjectsByAllowList } from "../streams";
import type { JudgingProject } from "../types";

const sample: JudgingProject[] = [
  {
    id: "a",
    name: "Alpha",
    team: "T1",
    tracks: ["AI", "Health"],
    members: [],
    description: null,
    room: null,
  },
  {
    id: "b",
    name: "Beta",
    team: "T2",
    tracks: ["Web"],
    members: [],
    description: null,
    room: null,
  },
];

describe("buildStreamsFromProjects", () => {
  it("collects all distinct tracks", () => {
    const streams = buildStreamsFromProjects(sample);
    expect(streams.map((s) => s.name).sort()).toEqual(["AI", "Health", "Web"]);
  });
});

describe("filterProjectsByAllowList", () => {
  it("returns all when allow list empty", () => {
    expect(filterProjectsByAllowList(sample)).toHaveLength(2);
  });

  it("filters to allowed ids", () => {
    expect(filterProjectsByAllowList(sample, ["b"]).map((p) => p.id)).toEqual(["b"]);
  });
});
