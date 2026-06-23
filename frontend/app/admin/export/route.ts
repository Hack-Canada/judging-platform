import { db } from "@/db";
import { submissions, judgingSlots } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

function csvCell(value: string) {
  const escaped = value.replace(/"/g, '""');
  return /[",\n]/.test(value) ? `"${escaped}"` : escaped;
}

export async function GET() {
  const rows = await db
    .select({
      projectName: submissions.projectName,
      room: judgingSlots.room,
      startTime: judgingSlots.startTime,
      endTime: judgingSlots.endTime,
      tracks: submissions.tracks,
      members: submissions.members,
      notes: judgingSlots.notes,
    })
    .from(judgingSlots)
    .innerJoin(submissions, eq(judgingSlots.submissionId, submissions.id))
    .orderBy(asc(judgingSlots.startTime));

  const header = [
    "project_name",
    "room",
    "start_time",
    "end_time",
    "tracks",
    "members",
    "notes",
  ];

  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.projectName),
        csvCell(r.room),
        csvCell(r.startTime.toISOString()),
        csvCell(r.endTime.toISOString()),
        csvCell(r.tracks ?? ""),
        csvCell(r.members ?? ""),
        csvCell(r.notes ?? ""),
      ].join(",")
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="judging-timetable.csv"',
    },
  });
}