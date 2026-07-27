import { getScheduleSlots } from "@/lib/schedule";

// Public read of the pitch schedule. Powers the live (polling) views on both
// the admin schedule manager and the hacker schedule page, so a change made by
// one admin shows up for everyone within a few seconds. Read-only — all
// mutations still go through /api/admin/schedule.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const slots = await getScheduleSlots();
    return Response.json(
      { ok: true, slots },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
