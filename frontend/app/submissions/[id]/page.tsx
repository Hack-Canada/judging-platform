import { db } from "@/db";
import { submissions, judgingSlots } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  return `${start.toLocaleTimeString("en-US", opts)} - ${end.toLocaleTimeString(
    "en-US",
    opts
  )}`;
}

function splitList(value: string | null) {
  return (value ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, id))
    .limit(1);

  if (!submission) notFound();

  const slots = await db
    .select({
      id: judgingSlots.id,
      startTime: judgingSlots.startTime,
      endTime: judgingSlots.endTime,
      room: judgingSlots.room,
      notes: judgingSlots.notes,
    })
    .from(judgingSlots)
    .where(eq(judgingSlots.submissionId, id))
    .orderBy(asc(judgingSlots.startTime));

  const tracks = splitList(submission.tracks);
  const members = splitList(submission.members);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/schedule"
        className="text-sm text-indigo-600 hover:underline"
      >
        ← Back to schedule
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        {submission.projectName}
      </h1>

      <a
        href={submission.devpostLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-sm text-indigo-600 hover:underline"
      >
        View on Devpost
      </a>

      {tracks.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
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

      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="font-medium text-gray-700">Submitter</dt>
          <dd className="text-gray-600">
            {submission.submitterName} ({submission.submitterEmail})
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-700">Team</dt>
          <dd className="text-gray-600">
            {members.length > 0 ? members.join(", ") : "None listed"}
          </dd>
        </div>
      </dl>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Scheduled slots</h2>
        {slots.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Not scheduled yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-200 rounded-lg border border-gray-200">
            {slots.map((slot) => (
              <li key={slot.id} className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900">
                  {formatRange(slot.startTime, slot.endTime)} · {slot.room}
                </p>
                {slot.notes && (
                  <p className="mt-1 text-xs text-gray-500">{slot.notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}