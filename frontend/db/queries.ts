import { eq, asc } from "drizzle-orm";
import { db } from "./index";
import { submissions, judgingSlots, type SlotWithSubmission } from "./schema";

export async function getAllSubmissions() {
  return db.select().from(submissions).orderBy(asc(submissions.projectName));
}

export async function getAllSlots(): Promise<SlotWithSubmission[]> {
  const rows = await db
    .select({ slot: judgingSlots, submission: submissions })
    .from(judgingSlots)
    .leftJoin(submissions, eq(judgingSlots.submissionId, submissions.id))
    .orderBy(asc(judgingSlots.startTime));
  return rows;
}

export async function getSlotById(id: string) {
  const rows = await db
    .select({ slot: judgingSlots, submission: submissions })
    .from(judgingSlots)
    .leftJoin(submissions, eq(judgingSlots.submissionId, submissions.id))
    .where(eq(judgingSlots.id, id))
    .limit(1);
  return rows[0] ?? null;
}
