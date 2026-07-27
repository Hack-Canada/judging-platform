import { getDemoSponsorSchedule } from "@/db/queries";
import { LiveSponsorSchedule } from "@/app/sponsor/schedule/live-sponsor-schedule";

export default async function SchedulePage() {
  const events = await getDemoSponsorSchedule();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-[var(--bg-gray)] px-4 py-5 sm:gap-6 sm:px-6 sm:py-7">
      <div>
        <h1 className="[font-family:var(--font-fredoka)] text-2xl font-semibold tracking-[-0.02em] text-[var(--brand-secondary)]">
          Schedule
        </h1>
        <p className="mt-1 [font-family:var(--font-figtree)] text-sm text-[var(--text-secondary)]">
          Events relevant to sponsors. Your own sessions are highlighted.
        </p>
      </div>
      <LiveSponsorSchedule initialEvents={events} />
    </div>
  );
}
