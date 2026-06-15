import Link from "next/link";
import { getAllSubmissions, getAllSlots, getSlotById } from "@/db/queries";
import { createSlot, updateSlot, deleteSlot } from "./actions";
import type { Submission, JudgingSlot } from "@/db/schema";

function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function SlotForm({
  submissions,
  slot,
  action,
  submitLabel,
  cancelHref,
}: {
  submissions: Submission[];
  slot?: JudgingSlot;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Project
          </label>
          <select
            name="submissionId"
            required
            defaultValue={slot?.submissionId ?? ""}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select a project…
            </option>
            {submissions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.projectName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Start time
          </label>
          <input
            type="datetime-local"
            name="startTime"
            required
            defaultValue={slot ? toDatetimeLocal(slot.startTime) : ""}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            End time
          </label>
          <input
            type="datetime-local"
            name="endTime"
            required
            defaultValue={slot ? toDatetimeLocal(slot.endTime) : ""}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Room
          </label>
          <input
            type="text"
            name="room"
            required
            placeholder="e.g. Room A, Table 3"
            defaultValue={slot?.room ?? ""}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Notes{" "}
            <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            name="notes"
            placeholder="Any additional notes…"
            defaultValue={slot?.notes ?? ""}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {submitLabel}
        </button>
        {cancelHref && (
          <Link
            href={cancelHref}
            className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm font-medium transition-colors"
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit: editId } = await searchParams;
  const [submissions, slots] = await Promise.all([getAllSubmissions(), getAllSlots()]);
  const editingRow = editId ? await getSlotById(editId) : null;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Admin Panel</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Manage the judging schedule
          </p>
        </div>
        <Link
          href="/schedule"
          className="text-sm px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          View schedule →
        </Link>
      </div>

      {/* Scheduled slots */}
      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Scheduled slots{" "}
          <span className="text-zinc-400 dark:text-zinc-500 font-normal">({slots.length})</span>
        </h2>

        {slots.length === 0 ? (
          <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            No slots scheduled yet. Use the form below to add the first one.
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map(({ slot, submission }) => (
              <div
                key={slot.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden"
              >
                {editId === slot.id && editingRow ? (
                  /* Inline edit form */
                  <div className="p-5">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                      Editing: {editingRow.submission?.projectName}
                    </p>
                    <SlotForm
                      submissions={submissions}
                      slot={slot}
                      action={updateSlot.bind(null, slot.id)}
                      submitLabel="Save changes"
                      cancelHref="/admin"
                    />
                  </div>
                ) : (
                  /* Slot row */
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {submission?.projectName ?? "—"}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <span className="font-mono">
                          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                        </span>
                        {" · "}
                        {slot.room}
                        {slot.notes && ` · ${slot.notes}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`?edit=${slot.id}`}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
                      >
                        Edit
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await deleteSlot(slot.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create new slot */}
      {!editId && (
        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Schedule a project
          </h2>
          {submissions.length === 0 ? (
            <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
              No projects imported yet. Run{" "}
              <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                npm run import
              </code>{" "}
              first.
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
              <SlotForm
                submissions={submissions}
                action={createSlot}
                submitLabel="Schedule project"
              />
            </div>
          )}
        </section>
      )}

      {/* Submissions reference */}
      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          All projects{" "}
          <span className="text-zinc-400 dark:text-zinc-500 font-normal">
            ({submissions.length})
          </span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          {submissions.filter((s) => slots.some((sl) => sl.slot.submissionId === s.id)).length} of{" "}
          {submissions.length} scheduled
        </p>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
          {submissions.length === 0 ? (
            <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm p-8">
              No projects yet — run{" "}
              <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                npm run import
              </code>
            </p>
          ) : (
            submissions.map((s) => {
              const scheduled = slots.some((sl) => sl.slot.submissionId === s.id);
              const trackList = s.tracks?.split("|").filter((t) => t !== "General" && t) ?? [];
              return (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${scheduled ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {s.projectName}
                    </p>
                    {trackList.length > 0 && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {trackList.join(" · ")}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium shrink-0 ${scheduled ? "text-green-600 dark:text-green-400" : "text-zinc-400 dark:text-zinc-500"}`}
                  >
                    {scheduled ? "Scheduled" : "Unscheduled"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
