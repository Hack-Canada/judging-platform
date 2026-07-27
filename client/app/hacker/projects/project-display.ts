import type { Project, ProjectScheduleSlot } from "@/lib/projects";

export type LinkKind = "github" | "youtube" | "demo" | "devpost";

export type DisplayScheduleSlot = {
  id: string;
  time: string;
  room: string;
  roomLocation: string | null;
  track: string | null;
  status: string;
  durationMinutes: number;
  project: Project;
};

export type ProjectTableRow = {
  id: string;
  project: Project;
  slot: DisplayScheduleSlot | null;
};

export type ProjectLinks = {
  github: string | null;
  youtube: string | null;
  demo: string | null;
  devpost: string | null;
};

const linkKeys: Record<LinkKind, string[]> = {
  github: [
    "github",
    "github_link",
    "github_url",
    "git_repo",
    "git_repository",
    "repo",
    "repo_url",
    "repository",
    "repository_url",
    "source_code",
    "source_code_url",
  ],
  youtube: [
    "youtube",
    "youtube_link",
    "youtube_url",
    "video",
    "video_link",
    "video_url",
    "demo_video",
    "demo_video_url",
  ],
  demo: [
    "demo",
    "demo_link",
    "demo_url",
    "live_demo",
    "live_demo_url",
    "live_post_demo",
    "project_url",
    "website",
  ],
  devpost: ["devpost", "devpost_link", "devpost_url"],
};

function jsonText(value: Project["raw"][string]) {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    const values = value
      .map((item) => (typeof item === "string" ? item.trim() : null))
      .filter(Boolean);
    return values.length > 0 ? values.join(", ") : null;
  }

  return null;
}

export function rawValue(project: Project, keys: string[]) {
  for (const key of keys) {
    const value = jsonText(project.raw[key]);
    if (value) return value;
  }

  return null;
}

function asUrl(value: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function projectLink(project: Project, kind: LinkKind) {
  return asUrl(rawValue(project, linkKeys[kind]));
}

export function projectLinks(project: Project): ProjectLinks {
  return {
    github: projectLink(project, "github"),
    youtube: projectLink(project, "youtube"),
    demo: projectLink(project, "demo"),
    devpost: projectLink(project, "devpost"),
  };
}

export function projectDescription(project: Project) {
  return (
    rawValue(project, [
      "description",
      "full_description",
      "project_description",
      "summary",
      "tagline",
      "elevator_pitch",
    ]) ?? "No project description has been added yet."
  );
}

export function projectTechStack(project: Project) {
  return rawValue(project, [
    "built_with",
    "tech_stack",
    "technologies",
    "technology",
    "tools",
  ]);
}

export function teamFilterLabel(project: Project) {
  if (project.team_name) return project.team_name;
  if (project.members.length > 0) return project.members.join(", ");
  return project.name ?? "Independent";
}

export function memberLabel(project: Project) {
  if (project.members.length > 0) return project.members.join(", ");
  return project.name ?? "No team members listed";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function submittedLabel(value: string | null) {
  if (!value) return "Submission time unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Submitted";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function scheduleTime(value: string, delayMinutes: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";

  const delayedDate = new Date(date.getTime() + delayMinutes * 60_000);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(delayedDate);
}

export function databaseJudgingSlot(
  slot: ProjectScheduleSlot,
): DisplayScheduleSlot {
  return {
    id: slot.id,
    time: scheduleTime(slot.scheduledAt, slot.delayMinutes),
    room: slot.room,
    roomLocation: slot.roomLocation,
    track: slot.track,
    status: slot.status,
    durationMinutes: slot.durationMinutes,
    project: slot.project,
  };
}
