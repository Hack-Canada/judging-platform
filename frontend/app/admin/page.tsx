import Link from "next/link";
import { getAllSubmissions, getAllSlots, getSlotById } from "@/db/queries";
import { createSlot, updateSlot } from "./actions";
import { DeleteButton } from "@/app/components/delete-button";
import { SlotForm } from "@/app/components/slot-form";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Admin</h1>

      {/* Scheduled slots */}
      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Scheduled slots{" "}
          <span className="text-zinc-400 font-normal">({slots.length})</span>
        </h2>

        {slots.length === 0 ? (
          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg py-10 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No slots scheduled yet.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
            {slots.map(({ slot, submission }) =>
              editId === slot.id && editingRow ? (
                <div key={slot.id} className="p-5">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wide">
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
                <div key={slot.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {submission?.projectName ?? "—"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      {" · "}
                      {slot.room}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`?edit=${slot.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
                    >
                      Edit
                    </Link>
                    <DeleteButton id={slot.id} />
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* Create new slot */}
      {!editId && (
        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Schedule a project
          </h2>

          {submissions.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No projects yet — run{" "}
              <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                npm run import
              </code>
            </p>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
              <SlotForm
                submissions={submissions}
                action={createSlot}
                submitLabel="Schedule project"
              />
            </div>
          )}
        </section>
      )}

      {/* All projects reference list */}
      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          All projects{" "}
          <span className="text-zinc-400 font-normal">({submissions.length})</span>
        </h2>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
          {submissions.map((s) => {
            const scheduled = slots.some((sl) => sl.slot.submissionId === s.id);
            const tracks = s.tracks
              ? s.tracks.split("|").filter((t) => t && t !== "General")
              : [];
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    scheduled ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {s.projectName}
                  </p>
                  {tracks.length > 0 && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {tracks.join(" · ")}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium shrink-0 ${
                    scheduled
                      ? "text-green-600 dark:text-green-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {scheduled ? "Scheduled" : "Unscheduled"}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
