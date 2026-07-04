import { getSql } from "@/lib/db";
import { snapToFiveMinutes } from "./format";
import { MOCK_PROJECTS, MOCK_SLOTS } from "./mock-data";
import type { DataSource, JudgingProject, JudgingSlot, MockReason } from "./types";

type ProjectRow = {
  id: string;
  project_name: string;
  tracks: string[] | null;
  members: string[] | null;
  devpost_link: string | null;
  submitter_name: string | null;
};

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

export async function getJudgingProjects(): Promise<{
  projects: JudgingProject[];
  source: DataSource;
  mockReason?: MockReason;
}> {
  if (!process.env.DATABASE_URL) {
    return { projects: MOCK_PROJECTS, source: "mock", mockReason: "no_env" };
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT id, project_name, tracks, members, devpost_link, submitter_name
      FROM projects
      ORDER BY project_name
      LIMIT 100
    `;

    if (!rows.length) {
      return { projects: MOCK_PROJECTS, source: "mock", mockReason: "empty" };
    }

    return {
      projects: (rows as ProjectRow[]).map(mapProject),
      source: "database",
    };
  } catch {
    return { projects: MOCK_PROJECTS, source: "mock", mockReason: "error" };
  }
}

export function getJudgingSlots(
  projects: JudgingProject[],
  source: DataSource
): JudgingSlot[] {
  if (source === "mock") {
    return MOCK_SLOTS;
  }

  const base = snapToFiveMinutes(new Date());
  return projects.slice(0, 4).map((project, index) => {
    const start = new Date(base.getTime() + index * 25 * 60_000);
    const end = new Date(start.getTime() + 15 * 60_000);

    return {
      id: `slot-${project.id}`,
      projectId: project.id,
      startTime: snapToFiveMinutes(start).toISOString(),
      endTime: snapToFiveMinutes(end).toISOString(),
      room: project.room,
    };
  });
}
