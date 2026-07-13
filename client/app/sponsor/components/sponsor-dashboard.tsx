import { DashboardHeader } from "@/app/sponsor/components/dashboard-header";
import { EventListItem } from "@/components/schedule/event-list-item";
import type { ScheduleEvent } from "@/db/queries";

export function SponsorDashboard({ events }: { events: ScheduleEvent[] }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <DashboardHeader />
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 p-4">
        <h2 className="text-lg font-semibold text-blue-700">Your Events</h2>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            You have no events assigned yet.
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {events.map((event) => (
              <EventListItem key={event.id} {...event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
