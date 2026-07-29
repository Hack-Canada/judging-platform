import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatEventTime } from "@/components/schedule/format-event-time";

export interface EventAssignee {
  name: string;
  role: string;
}

export function EventListItem({
  title,
  location,
  startTime,
  endTime,
  description,
  assignments = [],
}: {
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  description?: string;
  assignments?: EventAssignee[];
}) {
  const isAssigned = assignments.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] p-4 shadow-[0_10px_24px_rgba(15,42,67,0.06)] transition-colors hover:bg-[var(--bg-light)]",
        isAssigned && "ring-2 ring-[var(--brand-primary)]/40"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="[font-family:var(--font-fredoka)] text-base font-semibold tracking-[-0.01em] text-[var(--brand-secondary)]">
          {title}
        </span>
        {isAssigned && (
          <Badge className="bg-[var(--brand-accent)] text-white">
            {assignments.length > 1 ? `${assignments.length} assigned` : "Assigned"}
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-1 [font-family:var(--font-figtree)] text-sm text-[var(--text-secondary)]">
        <span>{formatEventTime(startTime, endTime)}</span>
        <span>{location}</span>
        {description && <p className="text-[var(--text-body)]">{description}</p>}
        {isAssigned && (
          <ul className="mt-1 flex flex-col gap-0.5">
            {assignments.map((assignee, index) => (
              <li key={index}>
                {assignee.name} — {assignee.role}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
