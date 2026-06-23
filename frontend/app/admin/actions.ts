"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne, lt, gt } from "drizzle-orm";
import { db } from "@/db";
import { judgingSlots } from "@/db/schema";

const slotSchema = z
  .object({
    submissionId: z.string().uuid("Please select a project"),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    room: z.string().min(1, "Room is required"),
    notes: z.string().optional(),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

type FormState = { error?: string; success?: boolean };

function parseSlot(formData: FormData) {
  return slotSchema.safeParse({
    submissionId: formData.get("submissionId"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    room: formData.get("room"),
    notes: formData.get("notes") || undefined,
  });
}

function revalidateBoth() {
  revalidatePath("/schedule");
  revalidatePath("/admin");
}

const fmt = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

// Two slots overlap when one starts before the other ends, and vice versa.
// excludeId lets an edit ignore the row it's updating.
async function findConflict(
  room: string,
  start: Date,
  end: Date,
  excludeId?: string
) {
  const [hit] = await db
    .select({
      startTime: judgingSlots.startTime,
      endTime: judgingSlots.endTime,
    })
    .from(judgingSlots)
    .where(
      and(
        eq(judgingSlots.room, room),
        lt(judgingSlots.startTime, end),
        gt(judgingSlots.endTime, start),
        excludeId ? ne(judgingSlots.id, excludeId) : undefined
      )
    )
    .limit(1);

  return hit ?? null;
}

export async function createSlot(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseSlot(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { submissionId, startTime, endTime, room, notes } = parsed.data;

  const conflict = await findConflict(room, startTime, endTime);
  if (conflict) {
    return {
      error: `${room} is already booked ${fmt(conflict.startTime)} - ${fmt(
        conflict.endTime
      )}.`,
    };
  }

  await db.insert(judgingSlots).values({
    submissionId,
    startTime,
    endTime,
    room,
    notes: notes ?? null,
  });

  revalidateBoth();
  redirect("/schedule");
}

export async function updateSlot(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    return { error: "Missing slot id" };
  }

  const parsed = parseSlot(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { submissionId, startTime, endTime, room, notes } = parsed.data;

  const conflict = await findConflict(room, startTime, endTime, id);
  if (conflict) {
    return {
      error: `${room} is already booked ${fmt(conflict.startTime)} - ${fmt(
        conflict.endTime
      )}.`,
    };
  }

  await db
    .update(judgingSlots)
    .set({ submissionId, startTime, endTime, room, notes: notes ?? null })
    .where(eq(judgingSlots.id, id));

  revalidateBoth();
  return { success: true };
}

export async function deleteSlot(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;

  await db.delete(judgingSlots).where(eq(judgingSlots.id, id));

  revalidateBoth();
}