import type { JudgingProject, SlotStatus } from "./types";

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
};

/** Single time format everywhere: "5:02 PM" */
export function formatSlotTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-CA", TIME_OPTS);
}

export function formatSlotRange(start: string, end: string) {
  return `${formatSlotTime(start)} - ${formatSlotTime(end)}`;
}

export function formatRelativeUntil(iso: string, at = Date.now()) {
  const ms = new Date(iso).getTime() - at;
  if (ms <= 0) return "now";
  const mins = Math.ceil(ms / 60_000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `in ${hours}h ${rem}m` : `in ${hours}h`;
}

export function deriveSlotStatus(
  startIso: string,
  endIso: string,
  at = Date.now()
): SlotStatus {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (at < start) return "upcoming";
  if (at >= end) return "done";
  return "live";
}

export type TimeRemaining = {
  label: string;
  minutes: number;
  seconds: number;
  overtime: boolean;
  overtimeSeconds: number;
};

export function getTimeRemaining(endIso: string, at = Date.now()): TimeRemaining {
  const ms = new Date(endIso).getTime() - at;
  if (ms <= 0) {
    const overtimeSeconds = Math.floor(-ms / 1000);
    const mins = Math.floor(overtimeSeconds / 60);
    const secs = overtimeSeconds % 60;
    return {
      label: `+${mins}:${String(secs).padStart(2, "0")}`,
      minutes: mins,
      seconds: secs,
      overtime: true,
      overtimeSeconds,
    };
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    label: `${minutes}:${String(seconds).padStart(2, "0")}`,
    minutes,
    seconds,
    overtime: false,
    overtimeSeconds: 0,
  };
}

export function getSlotProgress(startIso: string, endIso: string, at = Date.now()) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (at >= end) return 100;
  if (at <= start) return 0;
  return Math.round(((at - start) / (end - start)) * 100);
}

export function isValidRoom(room: string | null | undefined): room is string {
  if (!room) return false;
  const t = room.trim().toLowerCase();
  if (!t) return false;
  return t !== "tbd" && t !== "location tbd" && !t.startsWith("tbd ");
}

export function isPlaceholderDescription(
  description: string | null,
  projectName: string
): boolean {
  if (!description) return true;
  const t = description.trim();
  if (!t) return true;
  return (
    t.includes("imported from the project database") ||
    t === `${projectName} — imported from the project database.`
  );
}

export function getDisplayDescription(project: {
  name: string;
  description: string | null;
}): string | null {
  if (isPlaceholderDescription(project.description, project.name)) return null;
  return project.description;
}

export type ParsedLocation = {
  venue: string;
  tableLabel: string | null;
  tableNumber: string | null;
  full: string;
};

export function parseLocation(room: string): ParsedLocation {
  const full = room.trim();
  const separator = full.includes("·") ? "·" : full.includes(" - ") ? " - " : null;

  if (separator) {
    const [left, right] = full.split(separator).map((part) => part.trim());
    const tableMatch = right?.match(/table\s*#?\s*(\S+)/i);
    return {
      venue: left ?? full,
      tableLabel: right ?? null,
      tableNumber: tableMatch?.[1] ?? right ?? null,
      full,
    };
  }

  const inlineMatch = full.match(/table\s*#?\s*(\S+)/i);
  if (inlineMatch) {
    return {
      venue: full.replace(inlineMatch[0], "").replace(/[·\-]\s*$/, "").trim() || full,
      tableLabel: inlineMatch[0],
      tableNumber: inlineMatch[1],
      full,
    };
  }

  return { venue: full, tableLabel: null, tableNumber: null, full };
}

/** Snap to next 5-minute boundary for cleaner demo times. */
export function snapToFiveMinutes(date: Date): Date {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const mins = d.getMinutes();
  const rounded = Math.ceil(mins / 5) * 5;
  if (rounded === 60) {
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
  } else {
    d.setMinutes(rounded);
  }
  return d;
}

export function resolveSlotRoom(
  slotRoom: string | null,
  projectRoom: string | null
): string | null {
  if (isValidRoom(slotRoom)) return slotRoom!.trim();
  if (isValidRoom(projectRoom)) return projectRoom!.trim();
  return null;
}

/** Full team line under project title — all members, not submitter first name only. */
export function formatTeamLabel(project: JudgingProject): string {
  const members = project.members.map((m) => m.trim()).filter(Boolean);
  if (members.length > 0) return members.join(", ");
  const team = project.team.trim();
  if (team) return team;
  return "Independent team";
}
