"use client";

import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  MapPin,
  Search,
  Send,
  TableProperties,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { Project, ProjectScheduleSlot } from "@/lib/projects";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { ProjectDetailsDialog } from "./ProjectDetailsDialog";
import { ProjectTable } from "./ProjectTable";
import {
  databaseJudgingSlot,
  projectDescription,
  teamFilterLabel,
  type DisplayScheduleSlot,
  type ProjectTableRow,
} from "./project-display";

type ProjectsHubProps = {
  projects: Project[];
  scheduleSlots: ProjectScheduleSlot[];
  errorMessage: string | null;
};

type ActiveView = "projects" | "rooms";

type RoomGroup = {
  id: string;
  room: string;
  location: string | null;
  rows: ProjectTableRow[];
};

const ALL_TEAMS = "All teams";
const INITIAL_PROJECT_COUNT = 10;
const LIVE_REFRESH_INTERVAL_MS = 15_000;
const LIVE_REFRESH_DEBOUNCE_MS = 5_000;

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-[color:var(--bg-gray-dark)] bg-[var(--bg-white)] px-6 py-12 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-[var(--bg-primary-light)] text-[var(--text-primary)]">
        <FolderKanban aria-hidden="true" className="size-5" />
      </span>
      <h2 className="mt-4 [font-family:var(--font-fredoka)] text-xl font-semibold text-[var(--brand-secondary)]">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md [font-family:var(--font-figtree)] text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-light)] px-3 py-2">
      <span className="[font-family:var(--font-fredoka)] text-base font-semibold text-[var(--brand-secondary)]">
        {value}
      </span>
      <span className="[font-family:var(--font-figtree)] text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </span>
    </div>
  );
}

function ProjectListToggle({
  expanded,
  label,
  onToggle,
  total,
  embedded = false,
}: {
  expanded: boolean;
  label: string;
  onToggle: () => void;
  total: number;
  embedded?: boolean;
}) {
  const visibleCount = expanded
    ? total
    : Math.min(INITIAL_PROJECT_COUNT, total);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 sm:flex-row",
        embedded
          ? "border-t border-[var(--bg-gray)] bg-[var(--bg-light)] px-5 py-4 sm:px-6"
          : "px-1 pt-3",
      )}
    >
      <p className="[font-family:var(--font-figtree)] text-xs font-medium text-[var(--text-secondary)]">
        Showing {visibleCount} of {total} projects
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onToggle}
        aria-label={`${expanded ? "Show fewer" : "Show all"} ${label}`}
        className="h-9 rounded-full border-[color:var(--bg-gray-dark)] bg-[var(--bg-white)] px-4 [font-family:var(--font-figtree)] text-xs font-bold text-[var(--brand-secondary)] shadow-none hover:border-[var(--brand-primary)] hover:bg-[var(--bg-primary-light)] hover:text-[var(--text-primary)]"
      >
        {expanded ? (
          <ChevronUp aria-hidden="true" className="size-3.5" />
        ) : (
          <ChevronDown aria-hidden="true" className="size-3.5" />
        )}
        {expanded ? "Show fewer" : "Show all"}
      </Button>
    </div>
  );
}

function projectMatchesQuery(
  project: Project,
  query: string,
  slot?: DisplayScheduleSlot | null,
) {
  if (!query) return true;

  return [
    project.project_name,
    project.team_name,
    project.name,
    project.members.join(" "),
    projectDescription(project),
    slot?.room,
    slot?.roomLocation,
    slot?.track,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function ProjectsHub({
  projects,
  scheduleSlots,
  errorMessage,
}: ProjectsHubProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ActiveView>("projects");
  const [query, setQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(ALL_TEAMS);
  const [selectedRow, setSelectedRow] = useState<ProjectTableRow | null>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [expandedRoomProjects, setExpandedRoomProjects] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    let lastRefreshAt = Date.now();

    const refreshWhenActive = () => {
      if (
        document.visibilityState !== "visible" ||
        !window.navigator.onLine
      ) {
        return;
      }

      const now = Date.now();
      if (now - lastRefreshAt < LIVE_REFRESH_DEBOUNCE_MS) return;

      lastRefreshAt = now;
      router.refresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshWhenActive();
    };

    const refreshInterval = window.setInterval(
      refreshWhenActive,
      LIVE_REFRESH_INTERVAL_MS,
    );

    window.addEventListener("focus", refreshWhenActive);
    window.addEventListener("online", refreshWhenActive);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshWhenActive);
      window.removeEventListener("online", refreshWhenActive);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [router]);

  function resetProjectLimits() {
    setShowAllProjects(false);
    setExpandedRoomProjects(new Set());
  }

  function toggleRoomProjects(roomId: string) {
    setExpandedRoomProjects((current) => {
      const next = new Set(current);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  }

  const allTeams = useMemo(() => {
    const teams = new Set<string>();
    projects.forEach((project) => teams.add(teamFilterLabel(project)));
    return [ALL_TEAMS, ...Array.from(teams).sort()];
  }, [projects]);

  const displaySlots = useMemo(
    () => scheduleSlots.map(databaseJudgingSlot),
    [scheduleSlots],
  );

  const firstSlotByProject = useMemo(() => {
    const slots = new Map<string, DisplayScheduleSlot>();
    for (const slot of displaySlots) {
      if (!slots.has(slot.project.id)) {
        slots.set(slot.project.id, slot);
      }
    }
    return slots;
  }, [displaySlots]);

  const scheduledProjectIds = useMemo(
    () => new Set(displaySlots.map((slot) => slot.project.id)),
    [displaySlots],
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesTeam =
          selectedTeam === ALL_TEAMS ||
          teamFilterLabel(project) === selectedTeam;
        const slot = firstSlotByProject.get(project.id);
        return (
          matchesTeam &&
          projectMatchesQuery(project, normalizedQuery, slot)
        );
      }),
    [firstSlotByProject, normalizedQuery, projects, selectedTeam],
  );

  const projectRows = useMemo<ProjectTableRow[]>(
    () =>
      filteredProjects.map((project) => ({
        id: `project-${project.id}`,
        project,
        slot: firstSlotByProject.get(project.id) ?? null,
      })),
    [filteredProjects, firstSlotByProject],
  );

  const liveSelectedRow = useMemo<ProjectTableRow | null>(() => {
    if (!selectedRow) return null;

    const updatedProject = projects.find(
      (project) => project.id === selectedRow.project.id,
    );
    if (!updatedProject) return null;

    const updatedSlot =
      (selectedRow.slot
        ? displaySlots.find((slot) => slot.id === selectedRow.slot?.id)
        : null) ??
      firstSlotByProject.get(updatedProject.id) ??
      null;

    return {
      ...selectedRow,
      project: updatedProject,
      slot: updatedSlot,
    };
  }, [displaySlots, firstSlotByProject, projects, selectedRow]);

  const roomGroups = useMemo<RoomGroup[]>(() => {
    const groups = new Map<string, RoomGroup>();

    for (const slot of displaySlots) {
      const matchesTeam =
        selectedTeam === ALL_TEAMS ||
        teamFilterLabel(slot.project) === selectedTeam;
      if (
        !matchesTeam ||
        !projectMatchesQuery(slot.project, normalizedQuery, slot)
      ) {
        continue;
      }

      const groupId = `room-${slot.room}`;
      const existing = groups.get(groupId);
      const row: ProjectTableRow = {
        id: `slot-${slot.id}`,
        project: slot.project,
        slot,
      };

      if (existing) {
        existing.rows.push(row);
      } else {
        groups.set(groupId, {
          id: groupId,
          room: slot.room,
          location: slot.roomLocation,
          rows: [row],
        });
      }
    }

    const unassignedRows = projects
      .filter((project) => {
        const matchesTeam =
          selectedTeam === ALL_TEAMS ||
          teamFilterLabel(project) === selectedTeam;
        return (
          !scheduledProjectIds.has(project.id) &&
          matchesTeam &&
          projectMatchesQuery(project, normalizedQuery)
        );
      })
      .map<ProjectTableRow>((project) => ({
        id: `unassigned-${project.id}`,
        project,
        slot: null,
      }));

    const sortedGroups = Array.from(groups.values()).sort((a, b) =>
      a.room.localeCompare(b.room),
    );

    if (unassignedRows.length > 0) {
      sortedGroups.push({
        id: "room-unassigned",
        room: "Not assigned",
        location: null,
        rows: unassignedRows,
      });
    }

    return sortedGroups;
  }, [
    displaySlots,
    normalizedQuery,
    projects,
    scheduledProjectIds,
    selectedTeam,
  ]);

  const uniqueTeams = useMemo(
    () => new Set(projects.map((project) => teamFilterLabel(project))).size,
    [projects],
  );

  return (
    <>
      <main className="h-full w-full overflow-y-auto overscroll-none bg-[var(--bg-light)] text-[var(--text-body)]">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 pb-12 pt-5 sm:gap-6 sm:px-6 sm:py-7 xl:px-8 xl:py-8">
          <header
            className="hacker-card-enter relative overflow-hidden rounded-[1.75rem] border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] p-5 sm:p-7"
            style={{ animationDelay: "40ms" }}
          >
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-14 size-40 rounded-full border-[22px] border-[color:var(--bg-primary-light)]/70"
            />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="[font-family:var(--font-jetbrains-mono)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                  Project hub
                </p>
                <h1 className="mt-2 [font-family:var(--font-fredoka)] text-3xl font-semibold tracking-[-0.035em] text-[var(--brand-secondary)] sm:text-4xl">
                  Hacker projects
                </h1>
                <p className="mt-2 [font-family:var(--font-figtree)] text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                  Explore what hackers built and find every judging room,
                  presentation time, and project link in one place.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <SummaryItem label="projects" value={projects.length} />
                  <SummaryItem label="teams" value={uniqueTeams} />
                  <SummaryItem
                    label="scheduled"
                    value={scheduledProjectIds.size}
                  />
                </div>
              </div>

              <Button
                asChild
                className="h-11 w-fit rounded-full bg-[var(--brand-secondary)] px-5 [font-family:var(--font-figtree)] text-sm font-bold text-white shadow-none transition-transform hover:-translate-y-0.5 hover:bg-[var(--brand-secondary)]"
              >
                <Link href="/hacker/submission">
                  <Send aria-hidden="true" className="size-4" />
                  Submit your project
                </Link>
              </Button>
            </div>
          </header>

          {errorMessage ? (
            <div className="rounded-2xl border border-[color:var(--bg-danger)]/25 bg-[var(--bg-danger-light)] p-4 [font-family:var(--font-figtree)] text-sm text-[var(--text-danger)]">
              {errorMessage}
            </div>
          ) : null}

          <section
            className="hacker-card-enter flex flex-col gap-4 rounded-[1.75rem] border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] p-4 shadow-[0_10px_24px_rgba(15,42,67,0.06)] lg:flex-row lg:items-center lg:justify-between"
            style={{ animationDelay: "120ms" }}
            aria-label="Project table controls"
          >
            <div
              role="tablist"
              aria-label="Project view"
              className="grid w-full grid-cols-2 rounded-2xl bg-[var(--bg-gray)] p-1 lg:w-fit"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "projects"}
                onClick={() => setActiveView("projects")}
                className={cn(
                  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 [font-family:var(--font-figtree)] text-sm font-bold transition-colors",
                  activeView === "projects"
                    ? "bg-white text-[var(--brand-secondary)] shadow-[0_4px_12px_rgba(15,42,67,0.08)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--brand-secondary)]",
                )}
              >
                <TableProperties aria-hidden="true" className="size-4" />
                All projects
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "rooms"}
                onClick={() => setActiveView("rooms")}
                className={cn(
                  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 [font-family:var(--font-figtree)] text-sm font-bold transition-colors",
                  activeView === "rooms"
                    ? "bg-white text-[var(--brand-secondary)] shadow-[0_4px_12px_rgba(15,42,67,0.08)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--brand-secondary)]",
                )}
              >
                <MapPin aria-hidden="true" className="size-4" />
                Judging areas
              </button>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row lg:max-w-2xl lg:justify-end">
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-primary)]"
                />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    resetProjectLimits();
                  }}
                  placeholder="Search projects, people, or rooms"
                  className="h-11 rounded-xl border-[color:var(--bg-gray-dark)] bg-[var(--bg-light)] pl-10 [font-family:var(--font-figtree)] text-[var(--text-body)] shadow-none placeholder:text-[var(--text-tertiary)] focus-visible:border-[var(--brand-primary)] focus-visible:ring-[color:var(--brand-primary)]/20"
                />
              </div>

              <div className="relative sm:w-56">
                <Users
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--brand-accent)]"
                />
                <select
                  value={selectedTeam}
                  onChange={(event) => {
                    setSelectedTeam(event.target.value);
                    resetProjectLimits();
                  }}
                  aria-label="Filter by team"
                  className="h-11 w-full appearance-none rounded-xl border border-[color:var(--bg-gray-dark)] bg-[var(--bg-light)] pl-10 pr-8 [font-family:var(--font-figtree)] text-sm font-semibold text-[var(--brand-secondary)] outline-none transition-shadow focus:border-[var(--brand-primary)] focus:ring-3 focus:ring-[color:var(--brand-primary)]/20"
                >
                  {allTeams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-secondary)]"
                >
                  ▾
                </span>
              </div>
            </div>
          </section>

          <section
            className="hacker-card-enter"
            style={{ animationDelay: "190ms" }}
            aria-live="polite"
          >
            {activeView === "projects" ? (
              projectRows.length > 0 ? (
                <div>
                  <ProjectTable
                    rows={
                      showAllProjects
                        ? projectRows
                        : projectRows.slice(0, INITIAL_PROJECT_COUNT)
                    }
                    onOpenProject={setSelectedRow}
                  />
                  {projectRows.length > INITIAL_PROJECT_COUNT ? (
                    <ProjectListToggle
                      expanded={showAllProjects}
                      label="projects"
                      onToggle={() =>
                        setShowAllProjects((current) => !current)
                      }
                      total={projectRows.length}
                    />
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  title={
                    projects.length === 0
                      ? "No projects yet"
                      : "No projects match these filters"
                  }
                  description={
                    projects.length === 0
                      ? "Submitted projects will appear here as soon as hackers send them in."
                      : "Try another search term or switch the team filter back to All teams."
                  }
                />
              )
            ) : roomGroups.length > 0 ? (
              <div>
                <div className="mb-4 flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="[font-family:var(--font-fredoka)] text-2xl font-semibold text-[var(--brand-secondary)]">
                      Judging areas
                    </h2>
                    <p className="mt-1 [font-family:var(--font-figtree)] text-sm text-[var(--text-secondary)]">
                      Open a room to see its assigned presentations.
                    </p>
                  </div>
                  <p className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                    {displaySlots.length > 0
                      ? "Live database assignments"
                      : "Waiting for room assignments"}
                  </p>
                </div>

                <Accordion
                  type="multiple"
                  defaultValue={roomGroups[0] ? [roomGroups[0].id] : []}
                  className="gap-3"
                >
                  {roomGroups.map((group) => {
                    const showAllRoomProjects = expandedRoomProjects.has(
                      group.id,
                    );

                    return (
                      <AccordionItem
                        key={group.id}
                        value={group.id}
                        className="overflow-hidden rounded-[1.75rem] border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] shadow-[0_10px_24px_rgba(15,42,67,0.06)]"
                      >
                        <AccordionTrigger className="items-center gap-3 px-5 py-5 hover:no-underline sm:px-6">
                          <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-primary-light)] text-[var(--text-primary)]">
                                <MapPin
                                  aria-hidden="true"
                                  className="size-4"
                                />
                              </span>
                              <span className="min-w-0 text-left">
                                <span className="block [font-family:var(--font-fredoka)] text-lg font-semibold text-[var(--brand-secondary)]">
                                  {group.room}
                                </span>
                                <span className="mt-0.5 block truncate [font-family:var(--font-figtree)] text-xs text-[var(--text-secondary)]">
                                  {group.location ??
                                    (group.room === "Not assigned"
                                      ? "Projects waiting for a judging room"
                                      : "Location not provided")}
                                </span>
                              </span>
                            </span>
                            <span className="shrink-0 rounded-full bg-[var(--bg-gray)] px-2.5 py-1 [font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold text-[var(--text-secondary)]">
                              {group.rows.length}{" "}
                              {group.rows.length === 1
                                ? "project"
                                : "projects"}
                            </span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="border-t border-[var(--bg-gray)] p-0 [&_a]:no-underline">
                          <ProjectTable
                            rows={
                              showAllRoomProjects
                                ? group.rows
                                : group.rows.slice(0, INITIAL_PROJECT_COUNT)
                            }
                            onOpenProject={setSelectedRow}
                            embedded
                          />
                          {group.rows.length > INITIAL_PROJECT_COUNT ? (
                            <ProjectListToggle
                              expanded={showAllRoomProjects}
                              label={`projects in ${group.room}`}
                              onToggle={() => toggleRoomProjects(group.id)}
                              total={group.rows.length}
                              embedded
                            />
                          ) : null}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            ) : (
              <EmptyState
                title="No judging areas match"
                description="Try another search term or team filter to see room assignments."
              />
            )}
          </section>

          <div className="flex items-center justify-center gap-2 [font-family:var(--font-figtree)] text-xs text-[var(--text-secondary)]">
            <CalendarClock
              aria-hidden="true"
              className="size-4 text-[var(--brand-accent)]"
            />
            Presentation times include any organizer-applied delay.
          </div>
        </div>
      </main>

      <ProjectDetailsDialog
        selectedRow={liveSelectedRow}
        onOpenChange={(open) => {
          if (!open) setSelectedRow(null);
        }}
      />
    </>
  );
}
