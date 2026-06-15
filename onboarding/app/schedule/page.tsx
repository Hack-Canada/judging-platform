import Link from "next/link";
import { getAllSlots } from "@/db/queries";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function TrackBadge({ track }: { track: string }) {
  const colors: Record<string, string> = {
    "AI Track": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    "Fintech Track": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    "Healthcare Track": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    "Sustainability Track": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "Social Impact Track": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "Cybersecurity Track": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "EdTech Track": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    General: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };
  const cls = colors[track] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {track}
    </span>
  );
}

export default async function SchedulePage() {
  const slots = await getAllSlots();

  if (slots.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Judging Schedule</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
              Live timetable of all judging sessions
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Admin →
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            No sessions scheduled yet
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm">
            An admin needs to assign judging slots to projects before they appear here.
          </p>
          <Link
            href="/admin"
            className="mt-6 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  // Group by date
  const byDate = new Map<string, typeof slots>();
  for (const row of slots) {
    const dateKey = formatDate(row.slot.startTime);
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(row);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Judging Schedule</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            {slots.length} session{slots.length !== 1 ? "s" : ""} scheduled
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Admin →
        </Link>
      </div>

      <div className="space-y-10">
        {Array.from(byDate.entries()).map(([date, dateSlots]) => (
          <div key={date}>
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
              {date}
            </h2>
            <div className="space-y-3">
              {dateSlots.map(({ slot, submission }) => {
                const tracks = submission?.tracks?.split("|").filter(Boolean) ?? [];
                const members = submission?.members?.split("|").filter(Boolean) ?? [];

                return (
                  <div
                    key={slot.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex gap-6 items-start"
                  >
                    {/* Time column */}
                    <div className="shrink-0 w-28 text-right">
                      <p className="text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatTime(slot.startTime)}
                      </p>
                      <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                        – {formatTime(slot.endTime)}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="w-px self-stretch bg-zinc-200 dark:bg-zinc-700 shrink-0" />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {submission?.projectName ?? "Unknown project"}
                          </h3>
                          {submission?.devpostLink && (
                            <a
                              href={submission.devpostLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View on Devpost ↗
                            </a>
                          )}
                        </div>
                        <span className="shrink-0 text-xs font-medium px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md">
                          {slot.room}
                        </span>
                      </div>

                      {tracks.filter((t) => t !== "General").length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {tracks
                            .filter((t) => t !== "General")
                            .map((t) => (
                              <TrackBadge key={t} track={t} />
                            ))}
                        </div>
                      )}

                      {members.length > 0 && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                          {members.join(" · ")}
                        </p>
                      )}

                      {slot.notes && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 italic">
                          {slot.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
