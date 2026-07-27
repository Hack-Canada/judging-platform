import { getDemoSponsorSchedule } from "@/db/queries";

// Public read of the demo sponsor's schedule (public program + their own
// booth/schedule items). Powers the live (polling) view on the sponsor
// dashboard/schedule pages, mirroring GET /api/schedule's pattern for the
// judging schedule. Read-only.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await getDemoSponsorSchedule();
    return Response.json(
      { ok: true, events },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
