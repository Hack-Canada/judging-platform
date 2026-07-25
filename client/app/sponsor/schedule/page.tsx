import { getDemoSponsorSchedule } from "@/db/queries";
import { ScheduleViewSwitcher } from "@/components/schedule/schedule-view-switcher";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  let events: Awaited<ReturnType<typeof getDemoSponsorSchedule>> = [];
  let errorMessage: string | null = null;

  try {
    events = await getDemoSponsorSchedule();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-muted p-4">
      <div>
        <h1 className="text-2xl text-blue-700 font-semibold">Schedule</h1>
        <p className="text-sm text-muted-foreground">
          Events relevant to sponsors. Your own sessions are highlighted.
        </p>
      </div>
      {errorMessage && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
      <ScheduleViewSwitcher
        items={events.map((event) => ({
          id: event.id,
          title: event.title,
          location: event.location,
          startTime: event.startTime,
          endTime: event.endTime,
          description: event.description,
          assignments: event.assignments,
        }))}
      />
    </div>
  );
}
