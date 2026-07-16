import type { Shift } from "@/app/volunteer/data/shifts";
import { ShiftCard } from "@/app/volunteer/components/shift-card";

export function UpcomingShiftsList({
  shifts,
  onSelect,
}: {
  shifts: Shift[];
  onSelect: (shift: Shift) => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-2">
      <h2 className="text-sm font-medium text-blue-700">
        Upcoming Shifts
      </h2>
      <div className="flex flex-col gap-2">
        {shifts.map((shift) => (
          <ShiftCard key={shift.id} shift={shift} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
}
