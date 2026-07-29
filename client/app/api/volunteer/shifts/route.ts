import { getDemoVolunteerShifts } from "@/db/queries";

// Public read of the demo volunteer's shifts. Powers the live (polling) view
// on the volunteer dashboard/shift schedule, mirroring GET /api/schedule's
// pattern for the judging schedule. Read-only.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shifts = await getDemoVolunteerShifts();
    return Response.json(
      { ok: true, shifts },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
