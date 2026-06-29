import { getSql } from "@/lib/db";

// GET /api/db-check — verifies the Neon connection is working.
export async function GET() {
  try {
    const sql = getSql();
    const rows = await sql`SELECT version(), now() AS server_time`;
    return Response.json({ ok: true, result: rows[0] });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
