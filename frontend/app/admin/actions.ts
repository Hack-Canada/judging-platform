"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { judgingSlots } from "@/db/schema";

const slotSchema = z.object({
  submissionId: z.string().min(1, "Please select a project"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  room: z.string().min(1, "Room is required"),
  notes: z.string().optional(),
});

function parseDateTime(value: string): Date {
  return new Date(value);
}

export async function createSlot(formData: FormData) {
  const raw = {
    submissionId: formData.get("submissionId") as string,
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    room: formData.get("room") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const result = slotSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }

  const { submissionId, startTime, endTime, room, notes } = result.data;
  const start = parseDateTime(startTime);
  const end = parseDateTime(endTime);

  if (end <= start) {
    throw new Error("End time must be after start time");
  }

  await db.insert(judgingSlots).values({
    submissionId,
    startTime: start,
    endTime: end,
    room,
    notes: notes ?? null,
  });

  revalidatePath("/schedule");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateSlot(id: string, formData: FormData) {
  const raw = {
    submissionId: formData.get("submissionId") as string,
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    room: formData.get("room") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const result = slotSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }

  const { submissionId, startTime, endTime, room, notes } = result.data;
  const start = parseDateTime(startTime);
  const end = parseDateTime(endTime);

  if (end <= start) {
    throw new Error("End time must be after start time");
  }

  await db
    .update(judgingSlots)
    .set({ submissionId, startTime: start, endTime: end, room, notes: notes ?? null })
    .where(eq(judgingSlots.id, id));

  revalidatePath("/schedule");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteSlot(id: string) {
  await db.delete(judgingSlots).where(eq(judgingSlots.id, id));
  revalidatePath("/schedule");
  revalidatePath("/admin");
}
