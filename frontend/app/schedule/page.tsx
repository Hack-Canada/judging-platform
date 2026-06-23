import { db } from "@/db";
import { submissions, judgingSlots } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function splitList(value: string | null) {
  return (value ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const { track } = await searchParams;

  const rows = await db
    .select({
      id: judgingSlots.id,
      submissionId: judgingSlots.submissionId,
      startTime: judgingSlots.startTime,
      endTime: judgingSlots.endTime,
      room: judgingSlots.room,
      projectName: submissions.projectName,
      tracks: submissions.tracks,
      members: submissions.members,
    })
    .from(judgingSlots)
    .innerJoin(submissions, eq(judgingSlots.submissionId, submissions.id))
    .orderBy(asc(judgingSlots.startTime));

  const allTracks = Array.from(
    new Set(rows.flatMap((r) => splitList(r.tracks)))
  ).sort();

  const slots = track
    ? rows.filter((r) => splitList(r.tracks).includes(track))
    : rows;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Judging Schedule</h1>
      <p className="mt-1 text-sm text-gray-500">
        Project demo times and rooms for the hackathon.
      </p>

      {allTracks.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <FilterChip label="All" href="/schedule" active={!track} />
          {allTracks.map((t) => (
            <FilterChip
              key={t}
              label={t}
              href={`/schedule?track=${encodeURIComponent(t)}`}
              active={track === t}
            />
          ))}
        </div>
      )}

      {slots.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <p className="text-lg font-medium text-gray-900">
            {track ? `No slots for "${track}"` : "No slots scheduled yet"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {track
              ? "Try another track or view all."
              : "Check back once judging times have been assigned."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {slots.map((slot) => {
            const tracks = splitList(slot.tracks);
            const members = splitList(slot.members);
            return (
              <li
                key={slot.id}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/submissions/${slot.submissionId}`}
                    className="text-lg font-semibold text-gray-900 hover:text-indigo-600 hover:underline"
                  >
                    {slot.projectName}
                  </Link>
                  <span className="whitespace-nowrap text-sm font-medium text-gray-600">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-500">{slot.room}</p>

                {tracks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tracks.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {members.length > 0 && (
                  <p className="mt-3 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Team: </span>
                    {members.join(", ")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-indigo-600 px-3 py-1 text-sm font-medium text-white"
          : "rounded-full border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
      }
    >
      {label}
    </Link>
  );
}