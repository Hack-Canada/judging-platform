import { getProjects } from "@/lib/projects";

// GET /api/projects - returns public project fields from Neon.
export async function GET() {
  try {
    const result = await getProjects();

    return Response.json({
      ok: true,
      count: result.projects.length,
      projects: result.projects.map((project) => ({
        id: project.id,
        name: project.name,
        project_name: project.project_name,
        team_name: project.team_name,
        members: project.members,
        tracks: project.tracks,
        devpost_link: project.devpost_link,
        submitted_at: project.submitted_at,
      })),
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
