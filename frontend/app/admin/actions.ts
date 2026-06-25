"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { judgingSlots } from "@/db/schema";

const slotSchema = z.object({
  submissionId: z.string().min(1, "Please select a project"),
  startDate: z.string().min(1, "Start date is required"),
  startTimeOfDay: z.string().min(1, "Start time is required"),
  endDate: z.string().min(1, "End date is required"),
  endTimeOfDay: z.string().min(1, "End time is required"),
  room: z.string().min(1, "Room is required"),
  notes: z.string().optional(),
});

export async function createSlot(formData: FormData) {
  const raw = {
    submissionId: formData.get("submissionId") as string,
    startDate: formData.get("startDate") as string,
    startTimeOfDay: formData.get("startTimeOfDay") as string,
    endDate: formData.get("endDate") as string,
    endTimeOfDay: formData.get("endTimeOfDay") as string,
    room: formData.get("room") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const result = slotSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }

  const start = new Date(`${result.data.startDate}T${result.data.startTimeOfDay}`);
  const end = new Date(`${result.data.endDate}T${result.data.endTimeOfDay}`);

  if (end <= start) {
    throw new Error("End time must be after start time");
  }

  await db.insert(judgingSlots).values({
    submissionId: result.data.submissionId,
    startTime: start,
    endTime: end,
    room: result.data.room,
    notes: result.data.notes ?? null,
  });

  revalidatePath("/schedule");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateSlot(id: string, formData: FormData) {
  const raw = {
    submissionId: formData.get("submissionId") as string,
    startDate: formData.get("startDate") as string,
    startTimeOfDay: formData.get("startTimeOfDay") as string,
    endDate: formData.get("endDate") as string,
    endTimeOfDay: formData.get("endTimeOfDay") as string,
    room: formData.get("room") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const result = slotSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }

  const start = new Date(`${result.data.startDate}T${result.data.startTimeOfDay}`);
  const end = new Date(`${result.data.endDate}T${result.data.endTimeOfDay}`);

  if (end <= start) {
    throw new Error("End time must be after start time");
  }

  await db
    .update(judgingSlots)
    .set({
      submissionId: result.data.submissionId,
      startTime: start,
      endTime: end,
      room: result.data.room,
      notes: result.data.notes ?? null,
    })
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
