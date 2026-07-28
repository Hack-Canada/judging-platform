import type { Shift } from "@/app/volunteer/types";
import { ShiftCard } from "@/app/volunteer/ShiftCard";

export function UpcomingShiftsList({
  shifts,
  onSelect,
}: {
  shifts: Shift[];
  onSelect: (shift: Shift) => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-2">
      <h2 className="[font-family:var(--font-jetbrains-mono)] text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
        Upcoming Shifts
      </h2>
      <div className="flex flex-col gap-2">
        {shifts.map((shift, index) => (
          <div
            key={shift.id}
            className="hacker-card-enter"
            style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
          >
            <ShiftCard shift={shift} onClick={onSelect} />
          </div>
        ))}
      </div>
    </div>
  );
}
