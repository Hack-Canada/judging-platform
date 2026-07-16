import type { Shift } from "@/app/volunteer/data/shifts";
import { ShiftCard } from "@/app/volunteer/components/shift-card";

export function CurrentShiftCard({
  shift,
  onSelect,
}: {
  shift: Shift | undefined;
  onSelect: (shift: Shift) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-blue-700">
        Current Shift
      </h2>
      {shift ? (
        <ShiftCard shift={shift} current onClick={onSelect} />
      ) : (
        <p className="text-sm text-muted-foreground">
          You have no active shift right now.
        </p>
      )}
    </div>
  );
}
