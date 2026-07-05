import { getSql } from "@/lib/db";
import { snapToFiveMinutes } from "./format";
import {
  generateScaleMockSlots,
  MOCK_PROJECTS,
  MOCK_SLOTS,
  MOCK_STREAMS,
} from "./mock-data";
import type {
  DataSource,
  JudgingProject,
  JudgingSlot,
  JudgingStream,
  MockReason,
} from "./types";

type ProjectRow = {
  id: string;
  project_name: string;
  tracks: string[] | null;
  members: string[] | null;
  devpost_link: string | null;
  submitter_name: string | null;
};

function slugifyTrack(track: string): string {
  return track.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function streamIdFromProject(project: JudgingProject): string {
  const primary = project.tracks[0];
  return primary ? slugifyTrack(primary) : "general";
}

function buildStreamsFromProjects(projects: JudgingProject[]): JudgingStream[] {
  const byId = new Map<string, JudgingStream>();
  for (const project of projects) {
    const id = streamIdFromProject(project);
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        name: project.tracks[0] ?? "General",
        shortName: project.tracks[0] ?? "General",
      });
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function mapProject(row: ProjectRow): JudgingProject {
  return {
    id: row.id,
    name: row.project_name,
    team: row.submitter_name ?? "Independent team",
    tracks: row.tracks ?? [],
    members: row.members ?? [],
    description: null,
    devpostUrl: row.devpost_link,
    room: null,
  };
}

function mockDataset(): {
  projects: JudgingProject[];
  slots: JudgingSlot[];
} {
  if (process.env.JUDGING_SCALE_DEMO === "1") {
    const scale = generateScaleMockSlots("stream-maple", 40, new Date());
    return {
      projects: [...MOCK_PROJECTS, ...scale.projects],
      slots: [...MOCK_SLOTS, ...scale.slots],
    };
  }
  return { projects: MOCK_PROJECTS, slots: MOCK_SLOTS };
}

export async function getJudgingProjects(): Promise<{
  projects: JudgingProject[];
  streams: JudgingStream[];
  source: DataSource;
  mockReason?: MockReason;
}> {
  if (!process.env.DATABASE_URL) {
    const mock = mockDataset();
    return {
      projects: mock.projects,
      streams: MOCK_STREAMS,
      source: "mock",
      mockReason: "no_env",
    };
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT id, project_name, tracks, members, devpost_link, submitter_name
      FROM projects
      ORDER BY project_name
    `;

    if (!rows.length) {
      const mock = mockDataset();
      return {
        projects: mock.projects,
        streams: MOCK_STREAMS,
        source: "mock",
        mockReason: "empty",
      };
    }

    const projects = (rows as ProjectRow[]).map(mapProject);
    return {
      projects,
      streams: buildStreamsFromProjects(projects),
      source: "database",
    };
  } catch {
    const mock = mockDataset();
    return {
      projects: mock.projects,
      streams: MOCK_STREAMS,
      source: "mock",
      mockReason: "error",
    };
  }
}

export function getJudgingSlots(
  projects: JudgingProject[],
  source: DataSource
): JudgingSlot[] {
  if (source === "mock") {
    return mockDataset().slots;
  }

  const base = snapToFiveMinutes(new Date());
  const slotsByStream = new Map<string, number>();

  return projects.map((project) => {
    const streamId = streamIdFromProject(project);
    const indexInStream = slotsByStream.get(streamId) ?? 0;
    slotsByStream.set(streamId, indexInStream + 1);

    const start = new Date(base.getTime() + indexInStream * 25 * 60_000);
    const end = new Date(start.getTime() + 15 * 60_000);

    return {
      id: `slot-${project.id}`,
      projectId: project.id,
      streamId,
      startTime: snapToFiveMinutes(start).toISOString(),
      endTime: snapToFiveMinutes(end).toISOString(),
      room: project.room,
    };
  });
}

export function pickInitialStream(
  streams: JudgingStream[],
  slots: JudgingSlot[],
  preferredStreamId?: string
): string {
  if (preferredStreamId && streams.some((s) => s.id === preferredStreamId)) {
    return preferredStreamId;
  }
  return streams[0]?.id ?? slots[0]?.streamId ?? "general";
}
