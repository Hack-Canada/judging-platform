import { createSlot, applyGlobalDelay } from "@/lib/schedule";

// POST /api/admin/schedule — add a pitch to the schedule.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    const room = typeof body.room === "string" ? body.room.trim() : "";
    const scheduledAt = typeof body.scheduledAt === "string" ? body.scheduledAt : "";

    if (!projectId || !room || !scheduledAt) {
      return Response.json(
        { ok: false, error: "projectId, room, and scheduledAt are required." },
        { status: 400 }
      );
    }

    const slot = await createSlot({
      projectId,
      room,
      track: typeof body.track === "string" && body.track.trim() ? body.track.trim() : null,
      scheduledAt,
      durationMinutes:
        typeof body.durationMinutes === "number" ? body.durationMinutes : 5,
    });
    return Response.json({ ok: true, slot });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/schedule — apply a global delay (minutes) to every slot.
export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const minutes = typeof body.delayMinutes === "number" ? body.delayMinutes : NaN;
    if (!Number.isFinite(minutes) || minutes === 0) {
      return Response.json(
        { ok: false, error: "delayMinutes must be a non-zero number." },
        { status: 400 }
      );
    }
    const affected = await applyGlobalDelay(minutes);
    return Response.json({ ok: true, affected });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
