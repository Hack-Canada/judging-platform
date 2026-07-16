import { getProjects } from "@/lib/projects";

// GET /api/projects - returns all project-like rows from Neon.
export async function GET() {
  try {
    const result = await getProjects();

    return Response.json({
      ok: true,
      count: result.projects.length,
      sourceTable: result.sourceTable,
      availableTables: result.availableTables,
      projects: result.projects,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
