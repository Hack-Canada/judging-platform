import { getSql } from "@/lib/db";

// Data access for the Admin portal. All queries read the `projects` table,
// which holds the raw Devpost submissions (see db/schedule-schema.sql for the
// proposed scheduling tables that don't exist yet).

export type Project = {
  id: string;
  project_name: string;
  devpost_link: string | null;
  tracks: string[];
  submitter_name: string | null;
  submitter_email: string | null;
  members: string[];
  submitted_at: string | null;
};

export type SubmissionStats = {
  totalProjects: number;
  totalHackers: number;
  withDevpost: number;
  avgTeamSize: number;
  distinctTracks: number;
};

export async function getSubmissionStats(): Promise<SubmissionStats> {
  const sql = getSql();
  // Project-level aggregates (no unnest, so counts aren't fanned out by track);
  // distinct track count is computed in a separate subquery.
  const rows = await sql`
    SELECT
      count(*)::int AS total_projects,
      coalesce(sum(cardinality(members)), 0)::int AS total_hackers,
      count(devpost_link)::int AS with_devpost,
      coalesce(avg(cardinality(members)), 0)::float AS avg_team_size,
      (SELECT count(DISTINCT t)::int FROM projects, unnest(tracks) AS t) AS distinct_tracks
    FROM projects
  `;
  const r = rows[0];
  return {
    totalProjects: r.total_projects,
    totalHackers: r.total_hackers,
    withDevpost: r.with_devpost,
    avgTeamSize: Math.round(r.avg_team_size * 10) / 10,
    distinctTracks: r.distinct_tracks,
  };
}

export type TrackCount = { track: string; count: number };

export async function getTrackCounts(): Promise<TrackCount[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT t AS track, count(*)::int AS count
    FROM projects, unnest(tracks) AS t
    GROUP BY t
    ORDER BY count DESC, track ASC
  `;
  return rows.map((r) => ({ track: r.track, count: r.count }));
}

export type TeamSizeCount = { size: number; count: number };

export async function getTeamSizeDistribution(): Promise<TeamSizeCount[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT cardinality(members) AS size, count(*)::int AS count
    FROM projects
    GROUP BY size
    ORDER BY size ASC
  `;
  return rows.map((r) => ({ size: r.size, count: r.count }));
}

export type SubmissionBucket = { hour: string; count: number };

// Submissions grouped by hour, as a cumulative timeline.
export async function getSubmissionTimeline(): Promise<SubmissionBucket[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT date_trunc('hour', submitted_at) AS hour, count(*)::int AS count
    FROM projects
    WHERE submitted_at IS NOT NULL
    GROUP BY hour
    ORDER BY hour ASC
  `;
  let running = 0;
  return rows.map((r) => {
    running += r.count;
    return { hour: new Date(r.hour).toISOString(), count: running };
  });
}

// Full project list, ordered by submission time. Used by the schedule manager
// to seed a draft schedule and to power project search.
export async function getProjects(): Promise<Project[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, project_name, devpost_link, tracks, submitter_name,
           submitter_email, members, submitted_at
    FROM projects
    ORDER BY submitted_at ASC NULLS LAST, project_name ASC
  `;
  return rows as Project[];
}

// Editable fields for a submission. Matches the `projects` table (Linus's
// schema, db/projects.sql on linus/hacker) — id and submitted_at are not edited.
export type ProjectUpdate = {
  project_name: string;
  devpost_link: string | null;
  tracks: string[];
  submitter_name: string | null;
  submitter_email: string | null;
  members: string[];
};

export async function updateProject(
  id: string,
  fields: ProjectUpdate
): Promise<Project | null> {
  const sql = getSql();
  const rows = await sql`
    UPDATE projects SET
      project_name    = ${fields.project_name},
      devpost_link    = ${fields.devpost_link},
      tracks          = ${fields.tracks},
      submitter_name  = ${fields.submitter_name},
      submitter_email = ${fields.submitter_email},
      members         = ${fields.members},
      updated_at      = now()
    WHERE id = ${id}
    RETURNING id, project_name, devpost_link, tracks, submitter_name,
              submitter_email, members, submitted_at
  `;
  return (rows[0] as Project) ?? null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`DELETE FROM projects WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
