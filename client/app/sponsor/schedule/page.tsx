import { getDemoSponsorSchedule } from "@/db/queries";
import { ScheduleViewSwitcher } from "@/components/schedule/schedule-view-switcher";

export default async function SchedulePage() {
  const events = await getDemoSponsorSchedule();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-muted/40 p-4">
      <div>
        <h1 className="text-2xl text-blue-700 font-semibold">Schedule</h1>
        <p className="text-sm text-muted-foreground">
          Events relevant to sponsors. Your own sessions are highlighted.
        </p>
      </div>
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
