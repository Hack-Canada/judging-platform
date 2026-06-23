import { db } from "@/db";
import { submissions, judgingSlots } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { ScheduleForm } from "./schedule-form";
import { SlotRow } from "./slot-row";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const allSubmissions = await db
    .select({
      id: submissions.id,
      projectName: submissions.projectName,
      tracks: submissions.tracks,
    })
    .from(submissions)
    .orderBy(asc(submissions.projectName));

  const slots = await db
    .select({
      id: judgingSlots.id,
      submissionId: judgingSlots.submissionId,
      projectName: submissions.projectName,
      startTime: judgingSlots.startTime,
      endTime: judgingSlots.endTime,
      room: judgingSlots.room,
      notes: judgingSlots.notes,
    })
    .from(judgingSlots)
    .innerJoin(submissions, eq(judgingSlots.submissionId, submissions.id))
    .orderBy(asc(judgingSlots.startTime));

  const submissionOptions = allSubmissions.map((s) => ({
    id: s.id,
    projectName: s.projectName,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
      <p className="mt-1 text-sm text-gray-500">
        Assign and manage judging slots.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Submissions ({allSubmissions.length})
        </h2>
        <ul className="mt-3 divide-y divide-gray-200 rounded-lg border border-gray-200">
          {allSubmissions.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <span className="font-medium text-gray-900">{s.projectName}</span>
              <span className="text-xs text-gray-500">
                {(s.tracks ?? "").split("|").filter(Boolean).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Schedule a slot</h2>
        <ScheduleForm submissions={submissionOptions} />
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Scheduled slots ({slots.length})
          </h2>
          {slots.length > 0 && (
            <a
              href="/admin/export"
              download
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export CSV
            </a>
          )}
        </div>
        {slots.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No slots scheduled yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-200 rounded-lg border border-gray-200">
            {slots.map((slot) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                submissions={submissionOptions}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}