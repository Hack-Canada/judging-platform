"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AllDone } from "@/components/judging/all-done";
import { JudgeNotesPanel } from "@/components/judging/judge-notes-panel";
import { JudgingHeader } from "@/components/judging/judging-header";
import { LiveRibbon } from "@/components/judging/live-ribbon";
import { ProjectDetails, ProjectHero } from "@/components/judging/project-spotlight";
import { SessionRail } from "@/components/judging/session-rail";
import { findLiveSlot, getNextUnjudgedProjectId, withDerivedStatus } from "@/lib/judging/slots";
import { loadJudgingStorage, saveJudgingStorage } from "@/lib/judging/storage";
import type {
  DataSource,
  JudgeNotes,
  JudgingProject,
  JudgingSlot,
  MockReason,
} from "@/lib/judging/types";

type JudgingPortalProps = {
  projects: JudgingProject[];
  slots: JudgingSlot[];
  dataSource: DataSource;
  mockReason?: MockReason;
};

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function JudgingPortal({
  projects,
  slots,
  dataSource,
  mockReason,
}: JudgingPortalProps) {
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [judgedIds, setJudgedIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [earlyMarkedIds, setEarlyMarkedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<JudgeNotes>({});
  const [showSchedule, setShowSchedule] = useState(false);

  const derivedSlots = useMemo(() => withDerivedStatus(slots, now), [slots, now]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const stored = loadJudgingStorage();
    setJudgedIds(new Set(stored.judgedIds));
    setSkippedIds(new Set(stored.skippedIds));
    setNotes(stored.notes);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || slots.length === 0) return;
    const live = findLiveSlot(withDerivedStatus(slots, Date.now()), new Set());
    const first = live?.projectId ?? slots[0]?.projectId ?? "";
    setActiveProjectId((prev) => prev || first);
  }, [hydrated, slots]);

  useEffect(() => {
    if (!hydrated) return;
    saveJudgingStorage({
      judgedIds: [...judgedIds],
      skippedIds: [...skippedIds],
      notes,
    });
  }, [hydrated, judgedIds, skippedIds, notes]);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];
  const activeSlot = derivedSlots.find((s) => s.projectId === activeProjectId);
  const liveSlot = findLiveSlot(derivedSlots, judgedIds);
  const liveProject = liveSlot
    ? projects.find((p) => p.id === liveSlot.projectId)
    : undefined;

  const isJudged = judgedIds.has(activeProject?.id ?? "");
  const judgedCount = judgedIds.size;
  const allDone = slots.length > 0 && judgedCount >= slots.length;
  const judgedEarly = earlyMarkedIds.has(activeProject?.id ?? "");

  const showLiveRibbon =
    liveSlot &&
    liveProject &&
    activeProjectId !== liveSlot.projectId &&
    !isJudged;

  const completeJudging = useCallback(
    (projectId: string, mode: "judged" | "skipped") => {
      const project = projects.find((p) => p.id === projectId);
      if (!project || judgedIds.has(projectId)) return;

      const slot = derivedSlots.find((s) => s.projectId === projectId);
      const wasUpcoming = slot?.status === "upcoming";

      setJudgedIds((prev) => new Set(prev).add(projectId));
      if (mode === "skipped") {
        setSkippedIds((prev) => new Set(prev).add(projectId));
      }
      if (wasUpcoming) {
        setEarlyMarkedIds((prev) => new Set(prev).add(projectId));
      }

      const message =
        mode === "skipped" ? "Skipped — team absent" : "Marked as judged";

      toast.success(message, {
        description: project.name,
        action: {
          label: "Undo",
          onClick: () => {
            setJudgedIds((prev) => {
              const next = new Set(prev);
              next.delete(projectId);
              return next;
            });
            setSkippedIds((prev) => {
              const next = new Set(prev);
              next.delete(projectId);
              return next;
            });
            setEarlyMarkedIds((prev) => {
              const next = new Set(prev);
              next.delete(projectId);
              return next;
            });
            setActiveProjectId(projectId);
            scrollToTop();
          },
        },
      });

      const nextId = getNextUnjudgedProjectId(
        slots,
        new Set([...judgedIds, projectId]),
        projectId
      );
      if (nextId) {
        setActiveProjectId(nextId);
        scrollToTop();
      }
    },
    [projects, derivedSlots, judgedIds, slots]
  );

  function updateNotes(value: string) {
    if (!activeProject) return;
    setNotes((prev) => ({ ...prev, [activeProject.id]: value }));
  }

  function selectProject(id: string) {
    setActiveProjectId(id);
    scrollToTop();
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-[var(--j-muted)]">
        Loading…
      </div>
    );
  }

  if (!activeProject || slots.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col">
        <JudgingHeader
          dataSource={dataSource}
          mockReason={mockReason}
          judgedCount={0}
          totalCount={0}
        />
        <div className="mx-auto flex max-w-lg flex-1 flex-col justify-center px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--j-ink)]">
            Nothing scheduled
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--j-muted)]">
            Your judging block will show up here once projects are assigned.
          </p>
        </div>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="flex min-h-dvh flex-col">
        <JudgingHeader
          dataSource={dataSource}
          mockReason={mockReason}
          judgedCount={judgedCount}
          totalCount={slots.length}
        />
        <div className="j-content flex flex-1 flex-col justify-center">
          <AllDone judgedCount={judgedCount} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <JudgingHeader
        dataSource={dataSource}
        mockReason={mockReason}
        judgedCount={judgedCount}
        totalCount={slots.length}
      />

      {showLiveRibbon && liveSlot && liveProject && (
        <LiveRibbon
          liveSlot={liveSlot}
          liveProject={liveProject}
          onGoToLive={() => selectProject(liveSlot.projectId)}
        />
      )}

      <ProjectHero
        project={activeProject}
        slotStartTime={activeSlot?.startTime}
        slotEndTime={activeSlot?.endTime}
        slotStatus={activeSlot?.status ?? "upcoming"}
        slotRoom={activeSlot?.room}
        isJudged={isJudged}
        judgedEarly={judgedEarly}
      />

      <div className="j-content">
        <div className="j-content-grid">
          <div className="min-w-0">
            <ProjectDetails project={activeProject} />
            <JudgeNotesPanel
              project={activeProject}
              notes={notes[activeProject.id] ?? ""}
              onChange={updateNotes}
            />

            <div className="mt-8 lg:hidden">
              <button
                type="button"
                onClick={() => setShowSchedule((v) => !v)}
                className="text-base font-semibold text-[var(--j-action)]"
                aria-expanded={showSchedule}
              >
                {showSchedule ? "Hide schedule" : "Show full schedule"}
              </button>
              {showSchedule && (
                <div className="mt-4">
                  <SessionRail
                    slots={derivedSlots}
                    projects={projects}
                    activeProjectId={activeProject.id}
                    judgedIds={judgedIds}
                    onSelect={(id) => {
                      selectProject(id);
                      setShowSchedule(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <aside className="hidden lg:block">
            <SessionRail
              slots={derivedSlots}
              projects={projects}
              activeProjectId={activeProject.id}
              judgedIds={judgedIds}
              onSelect={selectProject}
            />
          </aside>
        </div>
      </div>

      <footer className="j-footer">
        <div className="j-footer-inner">
          <p className="hidden text-base text-[var(--j-muted)] sm:block">
            {isJudged
              ? "Marked as judged."
              : activeSlot?.status === "live"
                ? "Visit the table, then mark as judged."
                : "Review details before your slot."}
          </p>
          {!isJudged && (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => completeJudging(activeProject.id, "skipped")}
                className="j-cta-secondary w-full sm:w-auto"
              >
                Skip — team absent
              </button>
              <button
                type="button"
                onClick={() => completeJudging(activeProject.id, "judged")}
                className="j-cta w-full sm:w-auto"
              >
                Mark as judged
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
