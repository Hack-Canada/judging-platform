"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Github,
  LayoutGrid,
  LinkIcon,
  Search,
  Send,
  Trophy,
  Users,
  Youtube,
} from "lucide-react";

import type { Project, ProjectScheduleSlot } from "@/lib/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ProjectsHubProps = {
  projects: Project[];
  scheduleSlots: ProjectScheduleSlot[];
  errorMessage: string | null;
};

type LinkKind = "github" | "youtube" | "demo" | "devpost";
type DisplayScheduleSlot = {
  id: string;
  time: string;
  room: string;
  status: string;
  durationMinutes: number;
  project: Project;
  source: "database" | "generated";
};

const ALL_TEAMS = "All teams";

const judgingRooms = [
  "Judging Room A",
  "Judging Room B",
  "Expo Table 1",
  "Expo Table 2",
] as const;

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
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const values = value
      .map((item) => (typeof item === "string" ? item.trim() : null))
      .filter(Boolean);
    return values.length > 0 ? values.join(", ") : null;
  }

  return null;
}

function rawValue(project: Project, keys: string[]) {
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

function projectLink(project: Project, kind: LinkKind) {
  if (kind === "devpost" && project.devpost_link) {
    return asUrl(project.devpost_link);
  }

  return asUrl(rawValue(project, linkKeys[kind]));
}

function projectDescription(project: Project) {
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

function teamLabel(project: Project) {
  if (project.team_name) return project.team_name;
  if (project.members.length > 0) return `${project.members.length} members`;
  return project.name ?? "Independent submission";
}

function teamFilterLabel(project: Project) {
  if (project.team_name) return project.team_name;
  if (project.members.length > 0) return project.members.join(", ");
  return project.name ?? "Independent";
}

function memberLabel(project: Project) {
  if (project.members.length > 0) return project.members.join(", ");
  return project.name ?? "No team members listed";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function submittedLabel(value: string | null) {
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

function minutesToTime(totalMinutes: number) {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hour = hours24 % 12 || 12;

  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function generatedJudgingSlot(project: Project, index: number): DisplayScheduleSlot {
  const slotIndex = Math.floor(index / judgingRooms.length);
  const startMinutes = 9 * 60 + slotIndex * 12;

  return {
    id: `${project.id}-${index}`,
    time: minutesToTime(startMinutes),
    room: judgingRooms[index % judgingRooms.length],
    status: "preview",
    durationMinutes: 12,
    project,
    source: "generated",
  };
}

function scheduleTime(value: string, delayMinutes: number) {
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

function databaseJudgingSlot(slot: ProjectScheduleSlot): DisplayScheduleSlot {
  return {
    id: slot.id,
    time: scheduleTime(slot.scheduledAt, slot.delayMinutes),
    room: slot.room,
    status: slot.status,
    durationMinutes: slot.durationMinutes,
    project: slot.project,
    source: "database",
  };
}

function ProjectLinkButton({
  href,
  icon: Icon,
  label,
}: {
  href: string | null;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  if (!href) {
    return (
      <Button size="sm" variant="outline" disabled>
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" asChild>
      <a href={href} target="_blank" rel="noreferrer">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </a>
    </Button>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const githubUrl = projectLink(project, "github");
  const youtubeUrl = projectLink(project, "youtube");
  const demoUrl = projectLink(project, "demo");
  const devpostUrl = projectLink(project, "devpost");
  const isReady = Boolean(githubUrl || devpostUrl || demoUrl);

  return (
    <article className="rounded-lg border border-primary/10 bg-white p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/[0.02]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-black text-primary">
            {initials(project.project_name) || "P"}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-neutral-950">
              {project.project_name}
            </h3>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {teamLabel(project)}
            </p>
          </div>
        </div>

        <Badge
          variant={isReady ? "default" : "secondary"}
          className={isReady ? "" : "text-muted-foreground"}
        >
          {isReady ? "Ready" : "Needs link"}
        </Badge>
      </div>

      <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-600">
        {projectDescription(project)}
      </p>

      <Separator className="my-4" />

      <div className="grid gap-3 text-sm text-muted-foreground">
        <div className="flex min-w-0 items-center gap-2">
          <Users className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate">{memberLabel(project)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{submittedLabel(project.submitted_at ?? project.created_at)}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ProjectLinkButton href={githubUrl} icon={Github} label="GitHub" />
        <ProjectLinkButton href={devpostUrl ?? demoUrl} icon={ExternalLink} label="View" />
        <ProjectLinkButton href={youtubeUrl} icon={Youtube} label="Video" />
      </div>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-8 text-center">
      <p className="text-lg font-black text-neutral-950">{message}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Submitted projects will appear here once the database has entries.
      </p>
    </div>
  );
}

export function ProjectsHub({
  projects,
  scheduleSlots,
  errorMessage,
}: ProjectsHubProps) {
  const [activeView, setActiveView] = useState<"submissions" | "schedule">(
    "submissions"
  );
  const [query, setQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(ALL_TEAMS);

  const allTeams = useMemo(() => {
    const teams = new Set<string>();
    projects.forEach((project) => teams.add(teamFilterLabel(project)));

    return [ALL_TEAMS, ...Array.from(teams).sort()];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return projects.filter((project) => {
      const team = teamFilterLabel(project);
      const matchesTeam = selectedTeam === ALL_TEAMS || team === selectedTeam;
      const teamSearchText = [
        team,
        project.team_name,
        project.name,
        project.members.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const projectSearchText = [
        project.project_name,
        teamSearchText,
        projectDescription(project),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const searchableText =
        activeView === "schedule" ? teamSearchText : projectSearchText;

      return matchesTeam && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [activeView, projects, query, selectedTeam]);

  const readyProjects = projects.filter((project) =>
    Boolean(
      projectLink(project, "github") ||
        projectLink(project, "devpost") ||
        projectLink(project, "demo")
    )
  ).length;
  const progressValue = projects.length > 0 ? (readyProjects / projects.length) * 100 : 0;
  const uniqueTeams = new Set(
    projects.map((project) => teamFilterLabel(project))
  ).size;
  const filteredProjectIds = useMemo(
    () => new Set(filteredProjects.map((project) => project.id)),
    [filteredProjects]
  );
  const hasSavedSchedule = scheduleSlots.length > 0;
  const judgingSlots = useMemo(() => {
    if (hasSavedSchedule) {
      return scheduleSlots
        .filter((slot) => filteredProjectIds.has(slot.projectId))
        .map(databaseJudgingSlot);
    }

    return filteredProjects.map(generatedJudgingSlot);
  }, [filteredProjectIds, filteredProjects, hasSavedSchedule, scheduleSlots]);

  return (
    <main className="h-full w-full overflow-auto overscroll-none bg-white p-4 text-neutral-950 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-lg bg-primary px-5 py-6 text-primary-foreground shadow-sm sm:px-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
            <div>
              <Badge
                variant="secondary"
                className="mb-4 bg-white/15 text-primary-foreground"
              >
                Project hub
              </Badge>
              <h1 className="text-3xl font-black sm:text-4xl">
                Hacker Projects
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
                Browse submitted projects, open demo links, and check the judging
                schedule from one place.
              </p>
            </div>

            <div className="rounded-md bg-white/12 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Your submission</p>
                  <p className="text-sm text-primary-foreground/80">
                    Submit or edit before judging starts.
                  </p>
                </div>
                <Button asChild variant="secondary" className="font-bold">
                  <Link href="/hacker/submission">
                    <Send className="size-4" aria-hidden="true" />
                    Open
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-lg border-primary/10 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Total projects</CardDescription>
              <CardTitle className="text-3xl font-black">{projects.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-lg border-primary/10 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Teams represented</CardDescription>
              <CardTitle className="text-3xl font-black">{uniqueTeams}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-lg border-primary/10 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Ready for judges</CardDescription>
              <CardTitle className="text-3xl font-black">
                {readyProjects}/{projects.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progressValue} />
            </CardContent>
          </Card>
        </section>

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-4">
          <div className="flex flex-col gap-4 rounded-lg border border-primary/10 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div
              role="tablist"
              aria-label="Project view"
              className="grid h-auto w-full grid-cols-2 rounded-lg bg-primary/5 p-[3px] text-muted-foreground lg:w-fit"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "submissions"}
                onClick={() => setActiveView("submissions")}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  activeView === "submissions"
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "text-muted-foreground hover:text-neutral-950"
                )}
              >
                <LayoutGrid className="size-4" aria-hidden="true" />
                Project submissions
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "schedule"}
                onClick={() => setActiveView("schedule")}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  activeView === "schedule"
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "text-muted-foreground hover:text-neutral-950"
                )}
              >
                <CalendarClock className="size-4" aria-hidden="true" />
                Judging schedule
              </button>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3 lg:max-w-xl lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    activeView === "schedule"
                      ? "Search teams or members"
                      : "Search projects or teams"
                  }
                  className="h-10 bg-white pl-9"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:max-w-80">
                {allTeams.map((team) => (
                  <Button
                    key={team}
                    type="button"
                    size="sm"
                    variant={selectedTeam === team ? "default" : "outline"}
                    onClick={() => setSelectedTeam(team)}
                    className="max-w-48 shrink-0"
                  >
                    <span className="truncate">{team}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {activeView === "submissions" ? (
            <>
              {projects.length === 0 && !errorMessage ? (
                <EmptyState message="No projects found." />
              ) : filteredProjects.length === 0 ? (
                <EmptyState message="No projects match those filters." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
              <Card className="gap-0 overflow-hidden rounded-lg border-primary/10 bg-white py-0 shadow-sm">
                <CardHeader className="border-b border-primary/10 bg-primary/5 p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Trophy className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black">
                        Judging plan
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {hasSavedSchedule
                          ? "Times are loaded from schedule_slots."
                          : "Preview times until schedule_slots has saved rows."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 p-6">
                  <div className="rounded-md border border-primary/10 bg-primary/5 p-4">
                    <p className="text-sm font-bold text-primary">
                      {hasSavedSchedule ? "Next saved slot" : "Next preview block"}
                    </p>
                    <p className="mt-1 text-2xl font-black text-neutral-950">
                      {judgingSlots[0]?.time ?? "TBD"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {judgingSlots[0]?.room ?? "Waiting for submissions"}
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                      {hasSavedSchedule
                        ? "Schedule rows come from the database."
                        : "Preview rows follow the current team filter."}
                    </div>
                    <div className="flex items-center gap-2">
                      <LinkIcon className="size-4 text-primary" aria-hidden="true" />
                      Project links stay available from each row.
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-0 overflow-hidden rounded-lg border-primary/10 bg-white py-0 shadow-sm">
                <CardHeader className="border-b border-primary/10 p-6">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <CardTitle className="text-xl font-black">
                        Hacker judging schedule
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {judgingSlots.length} slot{judgingSlots.length === 1 ? "" : "s"} shown
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {judgingSlots.length === 0 ? (
                    <div className="p-6">
                      <EmptyState message="No schedule rows to show." />
                    </div>
                  ) : (
                    <div className="max-h-[620px] overflow-auto">
                      {judgingSlots.map(({ id, time, room, status, durationMinutes, project, source }, index) => {
                        const projectHref =
                          projectLink(project, "devpost") ??
                          projectLink(project, "demo") ??
                          projectLink(project, "github");

                        return (
                          <div
                            key={id}
                            className="grid gap-3 border-b border-primary/10 p-4 last:border-b-0 sm:grid-cols-[110px_140px_minmax(0,1fr)_auto] sm:items-center"
                          >
                            <div>
                              <p className="font-black text-neutral-950">{time}</p>
                              <p className="text-xs text-muted-foreground">
                                Slot {index + 1}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="secondary"
                                className="w-fit border border-primary/10 bg-primary/5 text-primary"
                              >
                                {room}
                              </Badge>
                              <Badge variant="outline" className="w-fit">
                                {source === "database"
                                  ? `${durationMinutes} min · ${status}`
                                  : "Preview"}
                              </Badge>
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-neutral-950">
                                {project.project_name}
                              </p>
                              <p className="truncate text-sm text-muted-foreground">
                                {teamFilterLabel(project)}
                              </p>
                            </div>
                            {projectHref ? (
                              <Button size="sm" variant="outline" asChild>
                                <a href={projectHref} target="_blank" rel="noreferrer">
                                  <ExternalLink
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                  View
                                </a>
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                <ExternalLink className="size-4" aria-hidden="true" />
                                View
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
