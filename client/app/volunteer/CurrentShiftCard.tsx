import type { Shift } from "@/app/volunteer/types";
import { ShiftCard } from "@/app/volunteer/ShiftCard";

export function CurrentShiftCard({
  shift,
  onSelect,
}: {
  shift: Shift | undefined;
  onSelect: (shift: Shift) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="[font-family:var(--font-jetbrains-mono)] text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
        Current Shift
      </h2>
      {shift ? (
        <ShiftCard shift={shift} current onClick={onSelect} />
      ) : (
        <p className="[font-family:var(--font-figtree)] text-sm text-[var(--text-secondary)]">
          You have no active shift right now.
        </p>
      )}
    </div>
  );
}
