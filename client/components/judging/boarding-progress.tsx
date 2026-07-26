type BoardingProgressProps = {
  completed: number;
  total: number;
  judged: number;
  skipped: number;
};

const SEGMENTS = 22;

/**
 * Boarding-gate light strip — stream progress as lit lamps, not a plain bar.
 */
export function BoardingProgress({
  completed,
  total,
  judged,
  skipped,
}: BoardingProgressProps) {
  if (total <= 0) return null;

  const progressPct = Math.round((completed / total) * 100);
  const lit = Math.round((completed / total) * SEGMENTS);

  return (
    <div
      className="j-boarding-progress"
      role="progressbar"
      aria-valuenow={progressPct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${judged} judged, ${skipped} skipped, ${total} total`}
    >
      {Array.from({ length: SEGMENTS }).map((_, index) => (
        <span
          key={index}
          className={
            index < lit
              ? "j-boarding-lamp j-boarding-lamp--on"
              : "j-boarding-lamp"
          }
          style={{ animationDelay: `${index * 18}ms` }}
          aria-hidden
        />
      ))}
    </div>
  );
}
