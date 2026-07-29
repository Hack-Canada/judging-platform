import { getPublicEvents } from "@/db/queries";
import { ScheduleViewSwitcher } from "@/components/schedule/schedule-view-switcher";

export default async function EventSchedulePage() {
  const events = await getPublicEvents();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-[var(--bg-gray)] px-4 py-5 sm:gap-6 sm:px-6 sm:py-7">
      <div>
        <h1 className="[font-family:var(--font-fredoka)] text-2xl font-semibold tracking-[-0.02em] text-[var(--brand-secondary)]">
          Event Schedule
        </h1>
        <p className="mt-1 [font-family:var(--font-figtree)] text-sm text-[var(--text-secondary)]">
          Everything happening during the event.
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
