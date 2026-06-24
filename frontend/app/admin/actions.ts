"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, judgingSlots } from "@/db";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const slotInputSchema = z
  .object({
    submissionId: z
      .string()
      .min(1, "Project is required.")
      .regex(uuidPattern, "Choose a valid project."),
    startTime: z.string().min(1, "Start time is required."),
    endTime: z.string().min(1, "End time is required."),
    room: z
      .string()
      .trim()
      .min(1, "Room is required.")
      .max(100, "Room must be 100 characters or fewer."),
    notes: z.string().trim(),
  })
  .superRefine((value, context) => {
    const start = new Date(value.startTime);
    const end = new Date(value.endTime);

    if (Number.isNaN(start.getTime())) {
      context.addIssue({
        code: "custom",
        message: "Start time must be a valid date.",
        path: ["startTime"],
      });
    }

    if (Number.isNaN(end.getTime())) {
      context.addIssue({
        code: "custom",
        message: "End time must be a valid date.",
        path: ["endTime"],
      });
    }

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      if (end <= start) {
        context.addIssue({
          code: "custom",
          message: "End time must be after start time.",
          path: ["endTime"],
        });
      }
    }
  });

const slotIdSchema = z
  .string()
  .min(1, "Slot id is required.")
  .regex(uuidPattern, "Slot id is invalid.");

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWithError(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

function redirectWithStatus(status: string): never {
  redirect(`/admin?status=${encodeURIComponent(status)}`);
}

function parseSlotInput(formData: FormData) {
  const parsed = slotInputSchema.safeParse({
    submissionId: getString(formData, "submissionId"),
    startTime: getString(formData, "startTime"),
    endTime: getString(formData, "endTime"),
    room: getString(formData, "room"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Invalid slot.");
  }

  return {
    submissionId: parsed.data.submissionId,
    startTime: new Date(parsed.data.startTime),
    endTime: new Date(parsed.data.endTime),
    room: parsed.data.room,
    notes: parsed.data.notes || null,
  };
}

function parseSlotId(formData: FormData) {
  const parsed = slotIdSchema.safeParse(getString(formData, "slotId"));

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Invalid slot id.");
  }

  return parsed.data;
}

function revalidateJudgingPages() {
  revalidatePath("/admin");
  revalidatePath("/schedule");
}

export async function createJudgingSlot(formData: FormData) {
  const values = parseSlotInput(formData);

  await db.insert(judgingSlots).values(values);
  revalidateJudgingPages();
  redirectWithStatus("created");
}

export async function updateJudgingSlot(formData: FormData) {
  const slotId = parseSlotId(formData);
  const values = parseSlotInput(formData);

  await db.update(judgingSlots).set(values).where(eq(judgingSlots.id, slotId));
  revalidateJudgingPages();
  redirectWithStatus("updated");
}

export async function deleteJudgingSlot(formData: FormData) {
  const slotId = parseSlotId(formData);

  await db.delete(judgingSlots).where(eq(judgingSlots.id, slotId));
  revalidateJudgingPages();
  redirectWithStatus("deleted");
}
