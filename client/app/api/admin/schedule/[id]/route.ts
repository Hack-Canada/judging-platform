import { updateSlot, deleteSlot, type SlotUpdate } from "@/lib/schedule";

// PATCH /api/admin/schedule/[id] — edit a single slot (time / room / track /
// duration). Only provided fields change.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fields: SlotUpdate = {};
    if (typeof body.room === "string" && body.room.trim()) fields.room = body.room.trim();
    if (typeof body.track === "string") fields.track = body.track.trim() || null;
    if (typeof body.scheduledAt === "string") fields.scheduledAt = body.scheduledAt;
    if (typeof body.durationMinutes === "number") fields.durationMinutes = body.durationMinutes;

    if (Object.keys(fields).length === 0) {
      return Response.json({ ok: false, error: "No fields to update." }, { status: 400 });
    }

    const slot = await updateSlot(id, fields);
    if (!slot) {
      return Response.json({ ok: false, error: "Slot not found." }, { status: 404 });
    }
    return Response.json({ ok: true, slot });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/schedule/[id] — remove a slot from the schedule.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const deleted = await deleteSlot(id);
    if (!deleted) {
      return Response.json({ ok: false, error: "Slot not found." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
