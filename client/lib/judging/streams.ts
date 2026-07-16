import type { JudgingProject, JudgingStream } from "./types";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Primary stream for slot grouping (first track). */
export function streamIdFromProject(project: JudgingProject): string {
  const primary = project.tracks[0];
  return primary ? slugify(primary) : "general";
}

/**
 * Build stream tabs from all distinct track names across projects,
 * not just the first project's track.
 */
export function buildStreamsFromProjects(projects: JudgingProject[]): JudgingStream[] {
  const byId = new Map<string, JudgingStream>();

  for (const project of projects) {
    const tracks = project.tracks.length ? project.tracks : ["General"];
    for (const track of tracks) {
      const id = slugify(track);
      if (!byId.has(id)) {
        byId.set(id, { id, name: track, shortName: track });
      }
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Filter projects (and downstream slots) to an allow-list from ?projects=a,b,c */
export function filterProjectsByAllowList(
  projects: JudgingProject[],
  allowList?: string[]
): JudgingProject[] {
  if (!allowList?.length) return projects;
  const allowed = new Set(allowList);
  return projects.filter((p) => allowed.has(p.id));
}
