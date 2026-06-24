import { asc, eq } from "drizzle-orm";
import { db, judgingSlots, submissions } from "@/db";

export const dynamic = "force-dynamic";

type ScheduleRow = {
  slot: typeof judgingSlots.$inferSelect;
  submission: typeof submissions.$inferSelect;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function splitPipes(value: string) {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatSlotTime(startTime: Date, endTime: Date) {
  const startDate = dateFormatter.format(startTime);
  const endDate = dateFormatter.format(endTime);
  const start = timeFormatter.format(startTime);
  const end = timeFormatter.format(endTime);

  if (startDate === endDate) {
    return `${startDate}, ${start} - ${end}`;
  }

  return `${startDate}, ${start} - ${endDate}, ${end}`;
}

function TrackBadge({ track }: { track: string }) {
  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
      {track}
    </span>
  );
}

function ScheduleItem({ row }: { row: ScheduleRow }) {
  const tracks = splitPipes(row.submission.tracks);
  const members = splitPipes(row.submission.members);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {formatSlotTime(row.slot.startTime, row.slot.endTime)}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {row.submission.projectName}
          </h2>
        </div>
        <p className="shrink-0 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
          {row.slot.room}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tracks.length > 0 ? (
          tracks.map((track) => <TrackBadge key={track} track={track} />)
        ) : (
          <span className="text-sm text-slate-500">No tracks listed</span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-slate-500">Team</p>
        <p className="mt-1 text-sm text-slate-700">
          {members.length > 0 ? members.join(", ") : "No members listed"}
        </p>
      </div>

      {row.slot.notes ? (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {row.slot.notes}
        </p>
      ) : null}
    </article>
  );
}

export default async function SchedulePage() {
  const slots = await db
    .select({
      slot: judgingSlots,
      submission: submissions,
    })
    .from(judgingSlots)
    .innerJoin(submissions, eq(judgingSlots.submissionId, submissions.id))
    .orderBy(asc(judgingSlots.startTime));

  return (
    <main className="min-h-full bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Public timetable
          </p>
          <h1 className="text-3xl font-semibold">Judging Schedule</h1>
        </div>

        {slots.length === 0 ? (
          <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold">No judging slots yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              Scheduled projects will appear here in chronological order.
            </p>
          </section>
        ) : (
          <div className="space-y-4">
            {slots.map((row) => (
              <ScheduleItem key={row.slot.id} row={row} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
