import {
  bumpScheduleOffsetMinutes,
  getScheduleOffsetMinutes,
  getServerNowIso,
  setScheduleOffsetMinutes,
} from "@/lib/judging/db-setup";

/** Read event config for judges (schedule offset, server clock). */
export async function GET() {
  const scheduleOffsetMinutes = await getScheduleOffsetMinutes();
  return Response.json({
    scheduleOffsetMinutes,
    serverNow: getServerNowIso(),
  });
}

/**
 * Organizer delay control: set absolute offset or bump by minutes.
 * Body: { scheduleOffsetMinutes: number } OR { addMinutes: number }
 */
export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    let next: number;

    if (typeof body.addMinutes === "number" && Number.isFinite(body.addMinutes)) {
      next = await bumpScheduleOffsetMinutes(body.addMinutes);
    } else if (
      typeof body.scheduleOffsetMinutes === "number" &&
      Number.isFinite(body.scheduleOffsetMinutes)
    ) {
      next = await setScheduleOffsetMinutes(body.scheduleOffsetMinutes);
    } else {
      return Response.json(
        {
          ok: false,
          error: "Provide scheduleOffsetMinutes or addMinutes as a number.",
        },
        { status: 400 }
      );
    }

    return Response.json({
      ok: true,
      scheduleOffsetMinutes: next,
      serverNow: getServerNowIso(),
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
