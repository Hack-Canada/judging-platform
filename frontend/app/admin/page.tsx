import { asc, eq } from "drizzle-orm";
import { db, judgingSlots, submissions } from "@/db";
import { createJudgingSlot, updateJudgingSlot } from "./actions";
import DeleteSlotButton from "./DeleteSlotButton";

export const dynamic = "force-dynamic";

type AdminSearchParams = Promise<{
  error?: string | string[];
  status?: string | string[];
}>;

type SlotRow = {
  slot: typeof judgingSlots.$inferSelect;
  submission: typeof submissions.$inferSelect;
};

const statusMessages: Record<string, string> = {
  created: "Judging slot created.",
  updated: "Judging slot updated.",
  deleted: "Judging slot deleted.",
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function splitPipes(value: string) {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatRange(startTime: Date, endTime: Date) {
  return `${timeFormatter.format(startTime)} - ${timeFormatter.format(endTime)}`;
}

function toDateTimeLocalValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function SelectProject({
  defaultValue,
  id,
  items,
}: {
  defaultValue?: string;
  id: string;
  items: (typeof submissions.$inferSelect)[];
}) {
  return (
    <select
      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      defaultValue={defaultValue ?? ""}
      id={id}
      name="submissionId"
      required
    >
      <option value="" disabled>
        Select a project
      </option>
      {items.map((submission) => (
        <option key={submission.id} value={submission.id}>
          {submission.projectName}
        </option>
      ))}
    </select>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

function SlotForm({
  action,
  allSubmissions,
  slotRow,
}: {
  action: (formData: FormData) => Promise<void>;
  allSubmissions: (typeof submissions.$inferSelect)[];
  slotRow?: SlotRow;
}) {
  const slot = slotRow?.slot;

  return (
    <form action={action} className="grid gap-4">
      {slot ? <input name="slotId" type="hidden" value={slot.id} /> : null}

      <Field label="Project">
        <SelectProject
          defaultValue={slot?.submissionId}
          id={slot ? `submission-${slot.id}` : "submissionId"}
          items={allSubmissions}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start time">
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            defaultValue={slot ? toDateTimeLocalValue(slot.startTime) : ""}
            name="startTime"
            required
            type="datetime-local"
          />
        </Field>

        <Field label="End time">
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            defaultValue={slot ? toDateTimeLocalValue(slot.endTime) : ""}
            name="endTime"
            required
            type="datetime-local"
          />
        </Field>
      </div>

      <Field label="Room">
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          defaultValue={slot?.room ?? ""}
          maxLength={100}
          name="room"
          placeholder="Room A"
          required
          type="text"
        />
      </Field>

      <Field label="Notes">
        <textarea
          className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          defaultValue={slot?.notes ?? ""}
          name="notes"
          placeholder="Optional"
        />
      </Field>

      <button
        className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
        type="submit"
      >
        {slot ? "Save changes" : "Create slot"}
      </button>
    </form>
  );
}

function TrackList({ value }: { value: string }) {
  const tracks = splitPipes(value);

  if (tracks.length === 0) {
    return <span className="text-sm text-slate-500">No tracks listed</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tracks.map((track) => (
        <span
          className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
          key={track}
        >
          {track}
        </span>
      ))}
    </div>
  );
}

function ExistingSlot({
  allSubmissions,
  row,
}: {
  allSubmissions: (typeof submissions.$inferSelect)[];
  row: SlotRow;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            {row.submission.projectName}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {formatRange(row.slot.startTime, row.slot.endTime)}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {row.slot.room}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeleteSlotButton
            projectName={row.submission.projectName}
            slotId={row.slot.id}
          />
        </div>
      </div>

      <details className="mt-4 border-t border-slate-200 pt-4">
        <summary className="cursor-pointer text-sm font-medium text-emerald-700">
          Edit
        </summary>
        <div className="mt-4">
          <SlotForm
            action={updateJudgingSlot}
            allSubmissions={allSubmissions}
            slotRow={row}
          />
        </div>
      </details>
    </article>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const query = await searchParams;
  const error = firstParam(query.error);
  const status = firstParam(query.status);

  const [allSubmissions, slotRows] = await Promise.all([
    db.select().from(submissions).orderBy(asc(submissions.projectName)),
    db
      .select({
        slot: judgingSlots,
        submission: submissions,
      })
      .from(judgingSlots)
      .innerJoin(submissions, eq(judgingSlots.submissionId, submissions.id))
      .orderBy(asc(judgingSlots.startTime)),
  ]);

  return (
    <main className="min-h-full bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Admin
          </p>
          <h1 className="text-3xl font-semibold">Judging Management</h1>
        </div>

        {error ? (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {status && statusMessages[status] ? (
          <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {statusMessages[status]}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Submissions</h2>
              <p className="text-sm text-slate-500">
                {allSubmissions.length} projects
              </p>
            </div>

            {allSubmissions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                <h3 className="text-lg font-semibold">No submissions yet</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Run the CSV import after pushing the schema.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {allSubmissions.map((submission) => (
                  <article
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    key={submission.id}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-950">
                          {submission.projectName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {submission.submitterName}
                        </p>
                      </div>
                      <TrackList value={submission.tracks} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-xl font-semibold">Create Judging Slot</h2>
            <div className="mt-5">
              <SlotForm
                action={createJudgingSlot}
                allSubmissions={allSubmissions}
              />
            </div>
          </aside>
        </div>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Scheduled Slots</h2>
            <p className="text-sm text-slate-500">{slotRows.length} slots</p>
          </div>

          {slotRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="text-lg font-semibold">No slots scheduled</h3>
              <p className="mt-2 text-sm text-slate-600">
                Created slots will be listed here for edits and deletes.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {slotRows.map((row) => (
                <ExistingSlot
                  allSubmissions={allSubmissions}
                  key={row.slot.id}
                  row={row}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
