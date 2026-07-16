type EventType =
  | "main"
  | "sponsor"
  | "workshop"
  | "activity"
  | "food"
  | "booth"
  | "judging"
  | "other";

type ScheduleEvent = {
  title: string;
  location: string;
};

type EventKey =
  | "main"
  | "sponsorWorkshop"
  | "otherWorkshop"
  | "activities1"
  | "activities2"
  | "food"
  | "sponsorBooth"
  | "judging"
  | "other";

type ScheduleRow = {
  time: string;
  events: Partial<Record<EventKey, ScheduleEvent>>;
};

type DaySchedule = {
  day: string;
  date: string;
  rows: ScheduleRow[];
};

type ScheduleColumn = {
  key: EventKey;
  label: string;
  type: EventType;
};

const rowHeight = 58;
const rowGap = 8;
const timelineStartMinutes = 0;
const timelineEndMinutes = 24 * 60;
const timelineStepMinutes = 30;

const columns: ScheduleColumn[] = [
  { key: "main", label: "MAIN EVENT", type: "main" },
  { key: "sponsorWorkshop", label: "SPONSOR\nWORKSHOPS", type: "sponsor" },
  { key: "otherWorkshop", label: "OTHER\nWORKSHOPS", type: "workshop" },
  { key: "activities1", label: "ACTIVITIES", type: "activity" },
  { key: "activities2", label: "ACTIVITIES", type: "activity" },
  { key: "food", label: "FOOD", type: "food" },
  { key: "sponsorBooth", label: "SPONSOR\nBOOTH", type: "booth" },
  { key: "judging", label: "JUDGING", type: "judging" },
  { key: "other", label: "OTHER", type: "other" },
];

const colorMap: Record<EventType, string> = {
  main: "border-violet-300 bg-violet-200 text-violet-950",
  sponsor: "border-pink-300 bg-pink-100 text-pink-950",
  workshop: "border-yellow-300 bg-yellow-100 text-yellow-950",
  activity: "border-green-300 bg-green-100 text-green-950",
  food: "border-blue-300 bg-blue-100 text-blue-950",
  booth: "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-950",
  judging: "border-orange-300 bg-orange-100 text-orange-950",
  other: "border-purple-300 bg-purple-200 text-purple-950",
};

const schedule: DaySchedule[] = [
  {
    day: "Friday",
    date: "November 21st",
    rows: [
      {
        time: "5:00 PM",
        events: {
          main: { title: "Check-in opens", location: "Main Lobby" },
          sponsorBooth: { title: "Sponsor fair", location: "Atrium" },
        },
      },
      {
        time: "5:30 PM",
        events: {
          main: { title: "Check-in opens", location: "Main Lobby" },
          sponsorBooth: { title: "Sponsor fair", location: "Atrium" },
        },
      },
      {
        time: "6:00 PM",
        events: {
          main: { title: "Check-in opens", location: "Main Lobby" },
          other: { title: "Help desk open", location: "Info Booth" },
        },
      },
      {
        time: "7:00 PM",
        events: {
          main: { title: "Opening ceremony", location: "Auditorium" },
        },
      },
      {
        time: "7:30 PM",
        events: {
          main: { title: "Opening ceremony", location: "Auditorium" },
        },
      },
      {
        time: "8:30 PM",
        events: {
          food: { title: "Dinner", location: "Dining Hall" },
          activities1: { title: "Team formation", location: "Room 101" },
          activities2: { title: "Team formation", location: "Room 101" },
        },
      },
      {
        time: "9:00 PM",
        events: {
          activities1: { title: "Team formation", location: "Room 101" },
          activities2: { title: "Team formation", location: "Room 101" },
        },
      },
      {
        time: "10:00 PM",
        events: {
          sponsorWorkshop: { title: "Build with APIs", location: "Room 208" },
          otherWorkshop: { title: "Project planning sprint", location: "Room 204" },
        },
      },
    ],
  },
  {
    day: "Saturday",
    date: "November 22nd",
    rows: [
      {
        time: "9:00 AM",
        events: {
          main: { title: "Hacking continues", location: "Hacker Space" },
          food: { title: "Breakfast", location: "Dining Hall" },
        },
      },
      {
        time: "9:30 AM",
        events: {
          main: { title: "Hacking continues", location: "Hacker Space" },
        },
      },
      {
        time: "10:00 AM",
        events: {
          main: { title: "Hacking continues", location: "Hacker Space" },
          sponsorWorkshop: { title: "AI product workshop", location: "Room 208" },
          otherWorkshop: { title: "Design systems crash course", location: "Room 206" },
        },
      },
      {
        time: "10:30 AM",
        events: {
          main: { title: "Hacking continues", location: "Hacker Space" },
          sponsorWorkshop: { title: "AI product workshop", location: "Room 208" },
          otherWorkshop: { title: "Design systems crash course", location: "Room 206" },
        },
      },
      {
        time: "12:00 PM",
        events: {
          food: { title: "Lunch", location: "Dining Hall" },
          sponsorBooth: { title: "Sponsor booth challenge", location: "Atrium" },
        },
      },
      {
        time: "1:00 PM",
        events: {
          activities1: { title: "Mini games", location: "Atrium" },
          activities2: { title: "Mini games", location: "Atrium" },
          sponsorBooth: { title: "Sponsor booth challenge", location: "Atrium" },
        },
      },
      {
        time: "6:00 PM",
        events: {
          food: { title: "Dinner", location: "Dining Hall" },
          other: { title: "Mentor office hours", location: "Help Desk" },
        },
      },
      {
        time: "11:30 PM",
        events: {
          main: { title: "Project submission deadline", location: "Online" },
        },
      },
    ],
  },
  {
    day: "Sunday",
    date: "November 23rd",
    rows: [
      {
        time: "9:00 AM",
        events: {
          food: { title: "Breakfast", location: "Dining Hall" },
          judging: { title: "Judging begins", location: "Expo Floor" },
        },
      },
      {
        time: "9:30 AM",
        events: {
          judging: { title: "Judging begins", location: "Expo Floor" },
        },
      },
      {
        time: "11:00 AM",
        events: {
          judging: { title: "Final demos", location: "Auditorium" },
          sponsorBooth: { title: "Sponsor expo", location: "Atrium" },
        },
      },
      {
        time: "12:30 PM",
        events: {
          food: { title: "Lunch", location: "Dining Hall" },
          judging: { title: "Final demos", location: "Auditorium" },
        },
      },
      {
        time: "3:00 PM",
        events: {
          main: { title: "Closing ceremony", location: "Auditorium" },
        },
      },
    ],
  },
];

const fullTimelineRows = generateTimelineRows();

function isSameEvent(a: ScheduleEvent | undefined, b: ScheduleEvent | undefined) {
  return Boolean(a && b && a.title === b.title && a.location === b.location);
}

function shouldSkipEvent(day: DaySchedule, rowIndex: number, key: EventKey) {
  if (rowIndex === 0) return false;
  return isSameEvent(day.rows[rowIndex]?.events[key], day.rows[rowIndex - 1]?.events[key]);
}

function getEventHeight(day: DaySchedule, rowIndex: number, key: EventKey) {
  const startEvent = day.rows[rowIndex]?.events[key];
  if (!startEvent) return rowHeight;

  let span = 1;
  for (let i = rowIndex + 1; i < day.rows.length; i++) {
    if (!isSameEvent(startEvent, day.rows[i]?.events[key])) break;
    span += 1;
  }

  return span * rowHeight + (span - 1) * rowGap;
}

function getMergedColumns(day: DaySchedule, rowIndex: number) {
  const row = day.rows[rowIndex];
  const mergedColumns: Array<{
    event: ScheduleEvent | undefined;
    key: EventKey;
    span: number;
    type: EventType;
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

    mergedColumns.push({
      event,
      key: column.key,
      span,
      type: column.type,
    });

    index += span;
  }

  return mergedColumns;
}

function withFullTimeline(day: DaySchedule): DaySchedule {
  const rowsByTime = new Map(day.rows.map((row) => [row.time, row]));

  return {
    ...day,
    rows: fullTimelineRows.map((row) => rowsByTime.get(row.time) ?? row),
  };
}

function EventBlock({
  day,
  event,
  rowIndex,
  eventKey,
  type,
}: {
  day: DaySchedule;
  event: ScheduleEvent;
  rowIndex: number;
  eventKey: EventKey;
  type: EventType;
}) {
  return (
    <article
      className={`absolute inset-x-0 top-0 z-20 flex select-text flex-col justify-center rounded-lg border-2 p-2 shadow-sm transition-shadow hover:shadow-md ${colorMap[type]}`}
      style={{ height: `${getEventHeight(day, rowIndex, eventKey)}px` }}
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

function DayScheduleView({ day }: { day: DaySchedule }) {
  const fullDay = withFullTimeline(day);

  return (
    <section className="w-full pb-5">
      <h2 className="sticky left-0 mb-3 mt-1 [font-family:var(--font-figtree)] text-2xl font-bold text-[#3f3850]">
        {day.day}, {day.date}
      </h2>

      <div className="relative space-y-2">
        {fullDay.rows.map((row, rowIndex) => (
          <div key={`${fullDay.day}-${row.time}`}>
            <div
              className="grid gap-2 border-t border-neutral-200 pt-1"
              style={{
                minHeight: `${rowHeight}px`,
                gridTemplateColumns: "70px repeat(9, minmax(96px, 1fr))",
              }}
            >
              <div className="pt-2 [font-family:var(--font-figtree)] text-xs font-medium text-[#776780]">
                {row.time}
              </div>

              {getMergedColumns(fullDay, rowIndex).map((column, columnIndex) => (
                <div
                  key={`${row.time}-${column.key}-${columnIndex}`}
                  className="relative"
                  style={{ gridColumn: `span ${column.span}` }}
                >
                  {column.event && !shouldSkipEvent(fullDay, rowIndex, column.key) ? (
                    <EventBlock
                      day={fullDay}
                      event={column.event}
                      rowIndex={rowIndex}
                      eventKey={column.key}
                      type={column.type}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function generateTimelineRows() {
  const rows: ScheduleRow[] = [];

  for (
    let minutes = timelineStartMinutes;
    minutes < timelineEndMinutes;
    minutes += timelineStepMinutes
  ) {
    rows.push({
      time: formatMinutesAsTime(minutes),
      events: {},
    });
  }

  return rows;
}

function formatMinutesAsTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export default function SchedulePage() {
  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f7f3ea] p-4 text-[#3f3850] sm:p-6">
      <header className="mb-4">
        <p className="[font-family:var(--font-jetbrains-mono)] text-xs font-semibold uppercase text-[#776780]">
          Live event
        </p>
        <h1 className="[font-family:var(--font-figtree)] text-3xl font-black">
          Schedule
        </h1>
        <p className="mt-2 max-w-2xl [font-family:var(--font-figtree)] text-sm text-[#776780]">
          Events connect across time slots and tracks when they continue, matching the compact live schedule style.
        </p>
      </header>

      <section className="min-h-0 flex-1 overflow-auto rounded-lg border border-white/70 bg-white/45 p-3 shadow-[0_8px_16px_rgba(0,0,0,0.05)] backdrop-blur sm:p-6">
        <div className="min-w-[1000px]">
          <div className="sticky top-0 z-40 mb-4 border-b-2 border-neutral-200 bg-white/75 py-3 backdrop-blur">
            <div
              className="grid items-center gap-2"
              style={{ gridTemplateColumns: "70px repeat(9, minmax(96px, 1fr))" }}
            >
              <div className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold text-[#776780]" />
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="whitespace-pre-line text-center [font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold leading-tight text-[#776780]"
                >
                  {column.label}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {schedule.map((day) => (
              <DayScheduleView key={day.day} day={day} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
