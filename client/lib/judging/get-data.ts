import { getSql } from "@/lib/db";
import {
  generateBoundedSyntheticSlots,
  readSlotGenerationConfig,
} from "./slot-generation";
import { buildStreamsFromProjects, filterProjectsByAllowList } from "./streams";
import type { JudgingProject, JudgingSlot, JudgingStream } from "./types";

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

export class JudgingLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JudgingLoadError";
  }
}

export type JudgingDataset = {
  projects: JudgingProject[];
  streams: JudgingStream[];
  slots: JudgingSlot[];
  /** Synthetic times compressed to fit judging window; order > clock. */
  scheduleApproximate: boolean;
};

export async function getJudgingDataset(options?: {
  projectAllowList?: string[];
}): Promise<JudgingDataset> {
  const allowList = options?.projectAllowList;

  if (!process.env.DATABASE_URL) {
    throw new JudgingLoadError(
      "DATABASE_URL is not set. Add your Neon connection string to client/.env.local."
    );
  }

  let rows: ProjectRow[];
  try {
    const sql = getSql();
    rows = (await sql`
      SELECT id, project_name, tracks, members, devpost_link, submitter_name
      FROM projects
      ORDER BY project_name
    `) as ProjectRow[];
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new JudgingLoadError(`Could not load projects from the database: ${detail}`);
  }

  if (!rows.length) {
    throw new JudgingLoadError(
      "No projects found in the database. Import submissions before opening the judge portal."
    );
  }

  const projects = filterProjectsByAllowList(rows.map(mapProject), allowList);

  if (!projects.length) {
    throw new JudgingLoadError(
      "No projects match the assignment filter. Check the ?projects= link."
    );
  }

  const { slots, scheduleApproximate } = generateBoundedSyntheticSlots(
    projects,
    readSlotGenerationConfig()
  );

  return {
    projects,
    streams: buildStreamsFromProjects(projects),
    slots,
    scheduleApproximate,
  };
}

export function pickInitialStream(
  streams: JudgingStream[],
  slots: JudgingSlot[],
  preferredStreamId?: string
): string {
  if (preferredStreamId && streams.some((s) => s.id === preferredStreamId)) {
    return preferredStreamId;
  }
  const general = streams.find((s) => s.id === "general");
  if (general) return general.id;
  return streams[0]?.id ?? slots[0]?.streamId ?? "general";
}

export function parseProjectAllowList(raw?: string): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length ? ids : undefined;
}
