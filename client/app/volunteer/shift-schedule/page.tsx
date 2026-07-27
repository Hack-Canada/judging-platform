import { getDemoVolunteerShifts } from "@/db/queries";
import { LiveShiftSchedule } from "@/app/volunteer/shift-schedule/live-shift-schedule";

export default async function ShiftSchedulePage() {
  const shifts = await getDemoVolunteerShifts();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-[var(--bg-gray)] px-4 py-5 sm:gap-6 sm:px-6 sm:py-7">
      <div>
        <h1 className="[font-family:var(--font-fredoka)] text-2xl font-semibold tracking-[-0.02em] text-[var(--brand-secondary)]">
          Shift Schedule
        </h1>
        <p className="mt-1 [font-family:var(--font-figtree)] text-sm text-[var(--text-secondary)]">
          All of your assigned shifts.
        </p>
      </div>
      <LiveShiftSchedule initialShifts={shifts} />
    </div>
  );
}
