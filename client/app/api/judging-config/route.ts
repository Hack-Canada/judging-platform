import {
  ensureJudgingTables,
  getScheduleOffsetMinutes,
  getServerNowIso,
  setScheduleOffsetMinutes,
} from "@/lib/judging/db-setup";

export async function GET() {
  const scheduleOffsetMinutes = await getScheduleOffsetMinutes();
  return Response.json({
    scheduleOffsetMinutes,
    serverNow: getServerNowIso(),
  });
}

export async function POST(request: Request) {
  const requiredKey = process.env.ORGANIZER_KEY;
  if (requiredKey) {
    const provided = request.headers.get("x-organizer-key");
    if (provided !== requiredKey) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "DATABASE_URL not configured — offset saved locally only on clients" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as { scheduleOffsetMinutes?: number };
    const minutes = Number(body.scheduleOffsetMinutes);
    if (!Number.isFinite(minutes)) {
      return Response.json({ error: "scheduleOffsetMinutes must be a number" }, { status: 400 });
    }

    await ensureJudgingTables();
    const scheduleOffsetMinutes = await setScheduleOffsetMinutes(minutes);
    return Response.json({ scheduleOffsetMinutes, serverNow: getServerNowIso() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to save config" },
      { status: 500 }
    );
  }
}
