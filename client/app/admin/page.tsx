import Link from "next/link";
import { getScheduleOffsetMinutes } from "@/lib/judging/db-setup";
import { AdminScheduleControls } from "./admin-schedule-controls";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const initialScheduleOffset = await getScheduleOffsetMinutes();

  return (
    <div className="min-h-dvh bg-background">
      <AdminScheduleControls initialScheduleOffset={initialScheduleOffset} />
      <p className="pb-8 text-center text-xs text-muted-foreground">
        <Link href="/judging" className="underline">
          Judge desk
        </Link>
      </p>
    </div>
  );
}
