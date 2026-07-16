import { getDatabaseTables } from "@/lib/projects";

// GET /api/db-tables - lists user tables and columns in the connected Neon DB.
export async function GET() {
  try {
    const tables = await getDatabaseTables();

    return Response.json({
      ok: true,
      count: tables.length,
      tables,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
