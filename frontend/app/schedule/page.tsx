import { getAllSlots } from "@/db/queries";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function SchedulePage() {
  const slots = await getAllSlots();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
        Judging Schedule
      </h1>

      {slots.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg py-16 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">No judging slots have been scheduled yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {slots.map(({ slot, submission }) => {
            const tracks = submission?.tracks ? submission.tracks.split("|").filter(Boolean) : [];
            const members = submission?.members ? submission.members.split("|").filter(Boolean) : [];

            return (
              <div
                key={slot.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {submission?.projectName ?? "Untitled Project"}
                    </p>

                    {members.length > 0 && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {members.join(", ")}
                      </p>
                    )}

                    {tracks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {tracks.map((track) => (
                          <span
                            key={track}
                            className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full px-2 py-0.5"
                          >
                            {track}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 font-mono">
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {slot.room}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
