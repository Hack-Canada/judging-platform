import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card
      size="sm"
      className={cn(
        "rounded-md border border-foreground/15 bg-card shadow-sm transition-colors hover:bg-muted/40",
        isAssigned && "ring-primary/40"
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{title}</CardTitle>
          {isAssigned && (
            <Badge>{assignments.length > 1 ? `${assignments.length} assigned` : "Assigned"}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
        <span>{formatEventTime(startTime, endTime)}</span>
        <span>{location}</span>
        {description && <p className="text-foreground">{description}</p>}
        {isAssigned && (
          <ul className="mt-1 flex flex-col gap-0.5">
            {assignments.map((assignee, index) => (
              <li key={index}>
                {assignee.name} — {assignee.role}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
