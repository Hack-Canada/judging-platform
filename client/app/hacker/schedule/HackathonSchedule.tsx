import { cn } from "@/lib/utils";

/** Public event categories supported by the hacker schedule theme. */
export type ScheduleEventType =
  | "main"
  | "sponsor"
  | "workshop"
  | "activity"
  | "food"
  | "booth"
  | "judging"
  | "other";

export type ScheduleEvent = {
  title: string;
  location?: string;
};

export type ScheduleRow = {
  time: string;
  events: Partial<Record<string, ScheduleEvent>>;
};

export type DaySchedule = {
  day: string;
  date: string;
  rows: ScheduleRow[];
};

export type ScheduleColumn = {
  key: string;
  label: string;
  type: ScheduleEventType;
  eventClassName?: string;
};

export type HackathonScheduleProps = {
  days: DaySchedule[];
  columns: ScheduleColumn[];
  eyebrow?: string;
  title?: string;
  description?: string;
  timelineStartMinutes?: number;
  timelineEndMinutes?: number;
  timelineStepMinutes?: number;
  className?: string;
};

const ROW_HEIGHT = 58;
const ROW_GAP = 8;
const TIME_COLUMN_WIDTH = 70;
const MINIMUM_TRACK_WIDTH = 96;

const eventColorMap: Record<ScheduleEventType, string> = {
  main: "border-[color:var(--brand-primary)]/40 bg-[var(--bg-primary-light)] text-[var(--brand-secondary)]",
  sponsor:
    "border-[color:var(--brand-accent)]/40 bg-[#def7f4] text-[var(--brand-secondary)]",
  workshop:
    "border-[color:var(--brand-primary)]/25 bg-[#eef6ff] text-[var(--brand-secondary)]",
  activity:
    "border-[color:var(--bg-success)]/35 bg-[var(--bg-success-light)] text-[var(--text-body)]",
  food: "border-[color:var(--bg-warning)]/40 bg-[var(--bg-warning-light)] text-[var(--text-body)]",
  booth:
    "border-[color:var(--brand-accent)]/35 bg-[#e7faf8] text-[var(--text-body)]",
  judging:
    "border-[color:var(--bg-danger)]/35 bg-[var(--bg-danger-light)] text-[var(--text-body)]",
  other:
    "border-[var(--bg-gray-dark)] bg-[var(--bg-gray)] text-[var(--text-body)]",
};

function isSameEvent(
  first: ScheduleEvent | undefined,
  second: ScheduleEvent | undefined,
) {
  return Boolean(
    first &&
      second &&
      first.title === second.title &&
      first.location === second.location,
  );
}

function shouldSkipEvent(
  day: DaySchedule,
  rowIndex: number,
  eventKey: string,
) {
  if (rowIndex === 0) return false;

  return isSameEvent(
    day.rows[rowIndex]?.events[eventKey],
    day.rows[rowIndex - 1]?.events[eventKey],
  );
}

function getEventHeight(
  day: DaySchedule,
  rowIndex: number,
  eventKey: string,
) {
  const startEvent = day.rows[rowIndex]?.events[eventKey];
  if (!startEvent) return ROW_HEIGHT;

  let span = 1;
  for (let index = rowIndex + 1; index < day.rows.length; index += 1) {
    if (!isSameEvent(startEvent, day.rows[index]?.events[eventKey])) break;
    span += 1;
  }

  return span * ROW_HEIGHT + (span - 1) * ROW_GAP;
}

function getMergedColumns(
  day: DaySchedule,
  rowIndex: number,
  columns: ScheduleColumn[],
) {
  const row = day.rows[rowIndex];
  const mergedColumns: Array<{
    column: ScheduleColumn;
    event: ScheduleEvent | undefined;
    span: number;
  }> = [];

  let index = 0;
  while (index < columns.length) {
    const column = columns[index];
    const event = row?.events[column.key];
    let span = 1;

    while (event && index + span < columns.length) {
      const nextColumn = columns[index + span];
      const nextEvent = row?.events[nextColumn.key];
      if (!isSameEvent(event, nextEvent)) break;
      span += 1;
    }

    mergedColumns.push({ column, event, span });
    index += span;
  }

  return mergedColumns;
}

function formatMinutesAsTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function generateTimelineRows(
  startMinutes: number,
  endMinutes: number,
  stepMinutes: number,
) {
  const rows: ScheduleRow[] = [];

  for (
    let minutes = startMinutes;
    minutes < endMinutes;
    minutes += stepMinutes
  ) {
    rows.push({
      time: formatMinutesAsTime(minutes),
      events: {},
    });
  }

  return rows;
}

function withFullTimeline(day: DaySchedule, timelineRows: ScheduleRow[]) {
  const rowsByTime = new Map(day.rows.map((row) => [row.time, row]));

  return {
    ...day,
    rows: timelineRows.map((row) => rowsByTime.get(row.time) ?? row),
  };
}

function EventBlock({
  day,
  event,
  rowIndex,
  column,
}: {
  day: DaySchedule;
  event: ScheduleEvent;
  rowIndex: number;
  column: ScheduleColumn;
}) {
  return (
    <article
      className={cn(
        "absolute inset-x-0 top-0 z-20 flex select-text flex-col justify-center rounded-xl border-2 p-2 shadow-[0_4px_10px_rgba(15,42,67,0.06)] transition-shadow hover:shadow-[0_7px_16px_rgba(15,42,67,0.1)]",
        column.eventClassName ?? eventColorMap[column.type],
      )}
      style={{ height: `${getEventHeight(day, rowIndex, column.key)}px` }}
    >
      <h3 className="[font-family:var(--font-figtree)] text-[11px] font-semibold leading-tight">
        {event.title}
      </h3>
      {event.location ? (
        <p className="mt-1 [font-family:var(--font-figtree)] text-[9px] italic opacity-75">
          {event.location}
        </p>
      ) : null}
    </article>
  );
}

function DayScheduleView({
  columns,
  day,
  gridTemplateColumns,
  timelineRows,
}: {
  columns: ScheduleColumn[];
  day: DaySchedule;
  gridTemplateColumns: string;
  timelineRows: ScheduleRow[];
}) {
  const fullDay = withFullTimeline(day, timelineRows);

  return (
    <section className="w-full pb-5">
      <h2 className="sticky left-0 mb-3 mt-1 [font-family:var(--font-figtree)] text-2xl font-bold text-[var(--brand-secondary)]">
        {day.day}, {day.date}
      </h2>

      <div className="relative space-y-2">
        {fullDay.rows.map((row, rowIndex) => (
          <div key={`${fullDay.day}-${fullDay.date}-${row.time}`}>
            <div
              className="grid gap-2 border-t border-[var(--bg-gray)] pt-1"
              style={{
                minHeight: `${ROW_HEIGHT}px`,
                gridTemplateColumns,
              }}
            >
              <div className="pt-2 [font-family:var(--font-figtree)] text-xs font-medium text-[var(--text-secondary)]">
                {row.time}
              </div>

              {getMergedColumns(fullDay, rowIndex, columns).map(
                ({ column, event, span }, columnIndex) => (
                  <div
                    key={`${row.time}-${column.key}-${columnIndex}`}
                    className="relative"
                    style={{ gridColumn: `span ${span}` }}
                  >
                    {event &&
                    !shouldSkipEvent(fullDay, rowIndex, column.key) ? (
                      <EventBlock
                        day={fullDay}
                        event={event}
                        rowIndex={rowIndex}
                        column={column}
                      />
                    ) : null}
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HackathonSchedule({
  days,
  columns,
  eyebrow = "Live event",
  title = "Schedule",
  description = "Events connect across time slots and tracks when they continue, matching the compact live schedule style.",
  timelineStartMinutes = 0,
  timelineEndMinutes = 24 * 60,
  timelineStepMinutes = 30,
  className,
}: HackathonScheduleProps) {
  const timelineRows = generateTimelineRows(
    timelineStartMinutes,
    timelineEndMinutes,
    timelineStepMinutes,
  );
  const gridTemplateColumns = `${TIME_COLUMN_WIDTH}px repeat(${columns.length}, minmax(${MINIMUM_TRACK_WIDTH}px, 1fr))`;
  const minimumScheduleWidth =
    TIME_COLUMN_WIDTH +
    columns.length * MINIMUM_TRACK_WIDTH +
    columns.length * ROW_GAP;

  return (
    <main
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--bg-light)] p-4 text-[var(--text-body)] sm:p-6",
        className,
      )}
    >
      <header
        className="hacker-card-enter mb-4"
        style={{ animationDelay: "40ms" }}
      >
        <p className="[font-family:var(--font-jetbrains-mono)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
          {eyebrow}
        </p>
        <h1 className="[font-family:var(--font-figtree)] text-3xl font-black text-[var(--brand-secondary)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl [font-family:var(--font-figtree)] text-sm text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
      </header>

      <section
        className="hacker-card-enter min-h-0 flex-1 overflow-auto rounded-[1.75rem] border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] p-3 shadow-[0_10px_24px_rgba(15,42,67,0.06)] sm:p-6"
        style={{ animationDelay: "120ms" }}
      >
        <div style={{ minWidth: `${minimumScheduleWidth}px` }}>
          <div className="sticky top-0 z-40 mb-4 border-b-2 border-[var(--bg-gray)] bg-white/95 py-3 backdrop-blur">
            <div
              className="grid items-center gap-2"
              style={{ gridTemplateColumns }}
            >
              <div className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold text-[var(--text-secondary)]" />
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="whitespace-pre-line text-center [font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold leading-tight text-[var(--text-secondary)]"
                >
                  {column.label}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {days.map((day) => (
              <DayScheduleView
                key={`${day.day}-${day.date}`}
                columns={columns}
                day={day}
                gridTemplateColumns={gridTemplateColumns}
                timelineRows={timelineRows}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
