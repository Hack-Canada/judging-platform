import {
  getScheduleOffsetMinutes,
  getServerNowIso,
} from "@/lib/judging/db-setup";

/** Read-only event config for judges (schedule offset, server clock). */
export async function GET() {
  const scheduleOffsetMinutes = await getScheduleOffsetMinutes();
  return Response.json({
    scheduleOffsetMinutes,
    serverNow: getServerNowIso(),
  });
}
