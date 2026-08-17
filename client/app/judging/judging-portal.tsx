"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionFeedback } from "@/components/judging/action-feedback";
import { BreakBanner } from "@/components/judging/break-banner";
import { CompletionBanner } from "@/components/judging/completion-banner";
import { DelayControl } from "@/components/judging/delay-control";
import { JudgeNotesPanel } from "@/components/judging/judge-notes-panel";
import { JudgingFooter } from "@/components/judging/judging-footer";
import { JudgingHeader } from "@/components/judging/judging-header";
import { LiveRibbon } from "@/components/judging/live-ribbon";
import { LoadingShell } from "@/components/judging/loading-shell";
import { ProjectDetails, ProjectHero } from "@/components/judging/project-spotlight";
import { ResetStreamConfirm } from "@/components/judging/reset-stream-confirm";
import { ReviewStamp } from "@/components/judging/review-stamp";
import { ScheduleDock } from "@/components/judging/schedule-dock";
import { SessionRail } from "@/components/judging/session-rail";
import { SkipReasonPicker } from "@/components/judging/skip-reason-picker";
import { WinnerBurst } from "@/components/judging/winner-burst";
import {
  loadJudgeCode,
  normalizeJudgeCode,
  resolveJudgeId,
  saveJudgeCode,
} from "@/lib/judging/judge-identity";
import { mergeStorageWithServer, serverRowsToStorage } from "@/lib/judging/hydrate-judgments";
import {
  enqueueJudgment,
  fetchJudgingConfig,
  fetchJudgmentsFromServer,
  syncNotesNow,
  syncRatingNow,
  syncWinnerNow,
  type JudgmentAction,
} from "@/lib/judging/offline-queue";
import {
  findBreakState,
  findLiveSlot,
  getAdjacentProjectIds,
  getNextUnjudgedProjectId,
  pickPrimarySlot,
  slotsForProject,
  slotsForStream,
  streamProgress,
  withDerivedStatus,
} from "@/lib/judging/slots";
import {
  applyScheduleOffset,
  formatOffsetLabel,
  loadLocalScheduleOffset,
  saveLocalScheduleOffset,
} from "@/lib/judging/schedule-offset";
import {
  clearJudgingStorage,
  loadJudgingStorage,
  saveJudgingStorage,
} from "@/lib/judging/storage";
import { useJudgingSync } from "@/lib/judging/use-judging-sync";
import type {
  JudgeNotes,
  JudgingProject,
  JudgingSlot,
  JudgingStream,
  SkipReason,
} from "@/lib/judging/types";

const JUDGING_ROUND = 1;

type JudgingPortalProps = {
  projects: JudgingProject[];
  slots: JudgingSlot[];
  streams: JudgingStream[];
  initialStreamId?: string;
  initialScheduleOffset?: number;
  initialJudgeCode?: string;
  scheduleApproximate?: boolean;
  /** When set via ?stream=, judge cannot switch to other tracks. */
  streamLocked?: boolean;
};

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

type FeedbackState = {
  message: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
} | null;

function applyStorage(
  streamId: string,
  setters: {
    setJudgedIds: (v: Set<string>) => void;
    setSkippedIds: (v: Set<string>) => void;
    setSkipReasons: (v: Record<string, SkipReason>) => void;
    setNotes: (v: JudgeNotes) => void;
    setEarlyMarkedIds: (v: Set<string>) => void;
    setWinnerIds: (v: Set<string>) => void;
    setRatings: (v: Record<string, number>) => void;
  }
) {
  const stored = loadJudgingStorage(streamId, JUDGING_ROUND);
  setters.setJudgedIds(new Set(stored.judgedIds));
  setters.setSkippedIds(new Set(stored.skippedIds));
  setters.setSkipReasons(stored.skipReasons);
  setters.setNotes(stored.notes);
  setters.setEarlyMarkedIds(new Set(stored.earlyMarkedIds));
  setters.setWinnerIds(new Set(stored.winnerIds));
  setters.setRatings(stored.ratings);
}

export function JudgingPortal({
  projects,
  slots,
  streams,
  initialStreamId,
  initialScheduleOffset = 0,
  initialJudgeCode,
  scheduleApproximate = false,
  streamLocked = false,
}: JudgingPortalProps) {
  const [now, setNow] = useState(() => Date.now());
  const [clientServerDeltaMs, setClientServerDeltaMs] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [judgeCode, setJudgeCode] = useState<string | null>(null);
  const [scheduleOffsetMinutes, setScheduleOffsetMinutes] = useState(
    () => initialScheduleOffset || loadLocalScheduleOffset()
  );
  const [activeStreamId, setActiveStreamId] = useState(
    () => initialStreamId ?? streams[0]?.id ?? ""
  );
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [judgedIds, setJudgedIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [skipReasons, setSkipReasons] = useState<Record<string, SkipReason>>({});
  const [earlyMarkedIds, setEarlyMarkedIds] = useState<Set<string>>(new Set());
  const [winnerIds, setWinnerIds] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<JudgeNotes>({});
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [skipPickerProjectId, setSkipPickerProjectId] = useState<string | null>(null);
  const [pendingSkipReason, setPendingSkipReason] = useState<SkipReason | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [reviewStampTrigger, setReviewStampTrigger] = useState(0);
  const [winnerBurstTrigger, setWinnerBurstTrigger] = useState(0);
  const notesDebounceRef = useRef<number | null>(null);

  const judgeId = resolveJudgeId(judgeCode);
  const adjustedNow = now + clientServerDeltaMs;

  useEffect(() => {
    const fromUrl = normalizeJudgeCode(initialJudgeCode);
    if (fromUrl) {
      saveJudgeCode(fromUrl);
      setJudgeCode(fromUrl);
    } else {
      setJudgeCode(loadJudgeCode());
    }
  }, [initialJudgeCode]);

  useEffect(() => {
    void fetchJudgingConfig().then(({ scheduleOffsetMinutes: minutes, serverNow }) => {
      setScheduleOffsetMinutes(minutes);
      saveLocalScheduleOffset(minutes);
      if (serverNow) {
        setClientServerDeltaMs(new Date(serverNow).getTime() - Date.now());
      }
    });
  }, []);

  const handleOffsetChange = useCallback((minutes: number) => {
    setScheduleOffsetMinutes(minutes);
    saveLocalScheduleOffset(minutes);
  }, []);

  const { status: syncStatus, pendingCount, pendingSummary, syncNow, refreshPending } =
    useJudgingSync(handleOffsetChange);

  const offsetSlots = useMemo(
    () => applyScheduleOffset(slots, scheduleOffsetMinutes),
    [slots, scheduleOffsetMinutes]
  );

  useEffect(() => {
    if (!feedback || feedback.actionLabel) return;
    const id = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(id);
  }, [feedback]);

  const derivedSlots = useMemo(
    () => withDerivedStatus(offsetSlots, adjustedNow),
    [offsetSlots, adjustedNow]
  );
  const streamSlots = useMemo(
    () => slotsForStream(derivedSlots, activeStreamId),
    [derivedSlots, activeStreamId]
  );

  const progressByStream = useMemo(() => {
    const map: Record<string, { judged: number; skipped: number; total: number }> = {};
    for (const stream of streams) {
      const streamOnly = slots.filter((s) => s.streamId === stream.id);
      if (stream.id === activeStreamId) {
        map[stream.id] = streamProgress(streamOnly, judgedIds, skippedIds);
      } else if (hydrated) {
        const stored = loadJudgingStorage(stream.id, JUDGING_ROUND);
        map[stream.id] = streamProgress(
          streamOnly,
          new Set(stored.judgedIds),
          new Set(stored.skippedIds)
        );
      } else {
        map[stream.id] = streamProgress(streamOnly, new Set(), new Set());
      }
    }
    return map;
  }, [streams, slots, hydrated, judgedIds, skippedIds, activeStreamId]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!activeStreamId && streams[0]) {
      setActiveStreamId(streams[0].id);
      return;
    }
    applyStorage(activeStreamId, {
      setJudgedIds,
      setSkippedIds,
      setSkipReasons,
      setNotes,
      setEarlyMarkedIds,
      setWinnerIds,
      setRatings,
    });
    setHydrated(true);
  }, [activeStreamId, streams]);

  useEffect(() => {
    if (!hydrated || !activeStreamId || !judgeId) return;
    void fetchJudgmentsFromServer({
      judgeId,
      streamId: activeStreamId,
      round: JUDGING_ROUND,
    }).then((rows) => {
      if (!rows.length) return;
      const local = loadJudgingStorage(activeStreamId, JUDGING_ROUND);
      const merged = mergeStorageWithServer(local, serverRowsToStorage(rows));
      setJudgedIds(new Set(merged.judgedIds));
      setSkippedIds(new Set(merged.skippedIds));
      setSkipReasons(merged.skipReasons);
      setNotes(merged.notes);
      setWinnerIds(new Set(merged.winnerIds));
      setRatings(merged.ratings);
    });
  }, [hydrated, activeStreamId, judgeId]);

  useEffect(() => {
    if (!hydrated || streamSlots.length === 0) return;
    const live = findLiveSlot(streamSlots, judgedIds);
    const firstUnjudged =
      streamSlots.find((s) => !judgedIds.has(s.projectId))?.projectId ??
      streamSlots[0]?.projectId ??
      "";
    const preferred = live?.projectId ?? firstUnjudged;
    setActiveProjectId((prev) => {
      const stillInStream = streamSlots.some((s) => s.projectId === prev);
      return stillInStream && prev ? prev : preferred;
    });
  }, [hydrated, streamSlots, activeStreamId]);

  useEffect(() => {
    if (!hydrated || !activeStreamId) return;
    saveJudgingStorage(
      activeStreamId,
      {
        judgedIds: [...judgedIds],
        skippedIds: [...skippedIds],
        skipReasons,
        notes,
        earlyMarkedIds: [...earlyMarkedIds],
        winnerIds: [...winnerIds],
        ratings,
      },
      JUDGING_ROUND
    );
  }, [
    hydrated,
    activeStreamId,
    judgedIds,
    skippedIds,
    skipReasons,
    notes,
    earlyMarkedIds,
    winnerIds,
    ratings,
  ]);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];
  const projectSlots = useMemo(
    () => (activeProject ? slotsForProject(streamSlots, activeProject.id) : []),
    [streamSlots, activeProject]
  );
  const activeSlot = useMemo(
    () => pickPrimarySlot(projectSlots, adjustedNow),
    [projectSlots, adjustedNow]
  );
  const notScheduled = projectSlots.length === 0;
  const multipleSlots = projectSlots.length > 1;

  const liveSlot = findLiveSlot(streamSlots, judgedIds);
  const liveProject = liveSlot
    ? projects.find((p) => p.id === liveSlot.projectId)
    : undefined;

  const isJudged = judgedIds.has(activeProject?.id ?? "");
  const isSkipped = skippedIds.has(activeProject?.id ?? "");
  const { judged: judgedCount, skipped: skippedCount, total: totalCount, remaining } =
    streamProgress(streamSlots, judgedIds, skippedIds);
  const streamAllDone = totalCount > 0 && remaining === 0;
  const judgedEarly = earlyMarkedIds.has(activeProject?.id ?? "");
  const activeStream = streams.find((s) => s.id === activeStreamId);
  const scheduleOffsetLabel = formatOffsetLabel(scheduleOffsetMinutes);

  const queueJudgment = useCallback(
    (
      projectId: string,
      action: JudgmentAction,
      extras?: { skipReason?: SkipReason | null; notes?: string; streamId?: string }
    ) => {
      enqueueJudgment({
        judgeId,
        streamId: extras?.streamId ?? activeStreamId,
        projectId,
        round: JUDGING_ROUND,
        action,
        notes: extras?.notes ?? notes[projectId],
        skipReason: extras?.skipReason,
      });
      refreshPending();
      void syncNow();
    },
    [judgeId, activeStreamId, notes, refreshPending, syncNow]
  );

  const showLiveRibbon =
    liveSlot &&
    liveProject &&
    activeProjectId !== liveSlot.projectId &&
    !isJudged;

  const breakState = findBreakState(streamSlots, judgedIds, adjustedNow);
  const breakNextProject = breakState
    ? projects.find((p) => p.id === breakState.nextProjectId)
    : undefined;

  const persistAndSwitchStream = useCallback(
    (nextStreamId: string) => {
      if (!activeStreamId) return;
      saveJudgingStorage(
        activeStreamId,
        {
          judgedIds: [...judgedIds],
          skippedIds: [...skippedIds],
          skipReasons,
          notes,
          earlyMarkedIds: [...earlyMarkedIds],
          winnerIds: [...winnerIds],
          ratings,
        },
        JUDGING_ROUND
      );
      setActiveStreamId(nextStreamId);
      applyStorage(nextStreamId, {
        setJudgedIds,
        setSkippedIds,
        setSkipReasons,
        setNotes,
        setEarlyMarkedIds,
        setWinnerIds,
        setRatings,
      });
      setSkipPickerProjectId(null);
      scrollToTop();
    },
    [activeStreamId, judgedIds, skippedIds, skipReasons, notes, earlyMarkedIds, winnerIds, ratings]
  );

  const unmarkJudging = useCallback((projectId: string) => {
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
    setSkipReasons((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
    setEarlyMarkedIds((prev) => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });
  }, []);

  const finishDecision = useCallback(
    (
      projectId: string,
      feedbackMessage: string,
      syncAction: JudgmentAction,
      extras?: { skipReason?: SkipReason | null }
    ) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project || judgedIds.has(projectId)) return;

      const slot = streamSlots.find((s) => s.projectId === projectId);
      const wasUpcoming = slot?.status === "upcoming";

      setJudgedIds((prev) => new Set(prev).add(projectId));
      if (syncAction === "skipped") {
        setSkippedIds((prev) => new Set(prev).add(projectId));
        if (extras?.skipReason) {
          setSkipReasons((prev) => ({ ...prev, [projectId]: extras.skipReason! }));
        }
      }
      if (wasUpcoming) {
        setEarlyMarkedIds((prev) => new Set(prev).add(projectId));
      }

      const nextId = getNextUnjudgedProjectId(
        streamSlots,
        new Set([...judgedIds, projectId]),
        projectId
      );
      const nextProject = nextId ? projects.find((p) => p.id === nextId) : undefined;

      setFeedback({
        message: feedbackMessage,
        detail: nextProject ? `Up next: ${nextProject.name}` : project.name,
        actionLabel: "Undo",
        onAction: () => {
          unmarkJudging(projectId);
          queueJudgment(projectId, "unmarked");
          setActiveProjectId(projectId);
          scrollToTop();
          setFeedback(null);
        },
      });

      queueJudgment(projectId, syncAction, { skipReason: extras?.skipReason ?? null });

      setSkipPickerProjectId(null);
      setPendingSkipReason(null);

      if (nextId) {
        setActiveProjectId(nextId);
        scrollToTop();
      }
    },
    [projects, streamSlots, judgedIds, unmarkJudging, queueJudgment]
  );

  const completeJudging = useCallback(
    (
      projectId: string,
      mode: "reviewed" | "skipped",
      reason: SkipReason | null = null
    ) => {
      if (mode === "reviewed") {
        setReviewStampTrigger((n) => n + 1);
      }

      const skipLabel =
        reason === "absent"
          ? "Skipped - absent"
          : reason === "not_ready"
            ? "Skipped - not ready"
            : reason === "wrong_track"
              ? "Skipped - wrong track"
              : "Skipped";

      finishDecision(
        projectId,
        mode === "skipped" ? skipLabel : "Marked reviewed",
        mode === "skipped" ? "skipped" : "reviewed",
        { skipReason: reason }
      );
    },
    [finishDecision]
  );

  const toggleWinner = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const nextPicked = !winnerIds.has(projectId);
      setWinnerIds((prev) => {
        const next = new Set(prev);
        if (nextPicked) next.add(projectId);
        else next.delete(projectId);
        return next;
      });

      void syncWinnerNow({
        judgeId,
        streamId: activeStreamId,
        projectId,
        round: JUDGING_ROUND,
        winner: nextPicked,
      });
      refreshPending();

      if (nextPicked) {
        setWinnerBurstTrigger((n) => n + 1);
        // Winner pick implies you've reviewed this project.
        if (!judgedIds.has(projectId)) {
          setReviewStampTrigger((n) => n + 1);
          finishDecision(projectId, "Winner pick · marked reviewed", "reviewed");
          return;
        }
        setFeedback({
          message: "Added to your winner picks",
          detail: project.name,
        });
        return;
      }

      setFeedback({
        message: "Removed from winner picks",
        detail: project.name,
      });
    },
    [
      projects,
      winnerIds,
      judgedIds,
      judgeId,
      activeStreamId,
      refreshPending,
      finishDecision,
    ]
  );

  const rateProject = useCallback(
    (projectId: string, rating: number | null) => {
      setRatings((prev) => {
        const next = { ...prev };
        if (rating === null) delete next[projectId];
        else next[projectId] = rating;
        return next;
      });

      void syncRatingNow({
        judgeId,
        streamId: activeStreamId,
        projectId,
        round: JUDGING_ROUND,
        rating,
      });
      refreshPending();
    },
    [judgeId, activeStreamId, refreshPending]
  );

  const unmarkWithToast = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project || !judgedIds.has(projectId)) return;

      unmarkJudging(projectId);
      queueJudgment(projectId, "unmarked");

      setFeedback({
        message: "Unmarked as judged",
        detail: project.name,
        actionLabel: "Redo",
        onAction: () => {
          completeJudging(projectId, "reviewed");
          setFeedback(null);
        },
      });
    },
    [projects, judgedIds, unmarkJudging, completeJudging, queueJudgment]
  );

  function confirmResetStream() {
    setJudgedIds(new Set());
    setSkippedIds(new Set());
    setSkipReasons({});
    setEarlyMarkedIds(new Set());
    setWinnerIds(new Set());
    setRatings({});
    clearJudgingStorage(activeStreamId, JUDGING_ROUND);
    setShowResetConfirm(false);

    const first = streamSlots[0]?.projectId;
    if (first) setActiveProjectId(first);
    setFeedback({ message: "Stream progress reset" });
    scrollToTop();
  }

  function updateNotes(value: string) {
    if (!activeProject) return;
    setNotes((prev) => ({ ...prev, [activeProject.id]: value }));

    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = window.setTimeout(() => {
      void syncNotesNow({
        judgeId,
        streamId: activeStreamId,
        projectId: activeProject.id,
        round: JUDGING_ROUND,
        notes: value,
      });
    }, 400);
  }

  const selectProject = useCallback((id: string) => {
    setActiveProjectId((prev) => (prev === id ? prev : id));
    setSkipPickerProjectId(null);
    scrollToTop();
  }, []);

  function startSkipFlow(projectId: string) {
    setSkipPickerProjectId(projectId);
    setPendingSkipReason(null);
  }

  const keyHandlerRef = useRef({
    skipPickerProjectId,
    activeProject,
    isJudged,
    liveSlot,
    streamSlots,
    completeJudging,
    unmarkWithToast,
    toggleWinner,
    selectProject,
    startSkipFlow,
  });

  keyHandlerRef.current = {
    skipPickerProjectId,
    activeProject,
    isJudged,
    liveSlot,
    streamSlots,
    completeJudging,
    unmarkWithToast,
    toggleWinner,
    selectProject,
    startSkipFlow,
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      const ctx = keyHandlerRef.current;
      if (ctx.skipPickerProjectId) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (target?.isContentEditable) return;

      if (e.key === "j" && !ctx.isJudged && ctx.activeProject) {
        e.preventDefault();
        ctx.completeJudging(ctx.activeProject.id, "reviewed");
      }
      if (e.key === "s" && !ctx.isJudged && ctx.activeProject) {
        e.preventDefault();
        ctx.startSkipFlow(ctx.activeProject.id);
      }
      if (e.key === "u" && ctx.isJudged && ctx.activeProject) {
        e.preventDefault();
        ctx.unmarkWithToast(ctx.activeProject.id);
      }
      if (e.key === "w" && ctx.activeProject) {
        e.preventDefault();
        ctx.toggleWinner(ctx.activeProject.id);
      }
      if (e.key === "g" && ctx.liveSlot) {
        e.preventDefault();
        ctx.selectProject(ctx.liveSlot.projectId);
      }
      if (e.key === "ArrowRight" && ctx.activeProject) {
        const { next } = getAdjacentProjectIds(
          ctx.streamSlots,
          ctx.activeProject.id
        );
        if (next) {
          e.preventDefault();
          ctx.selectProject(next);
        }
      }
      if (e.key === "ArrowLeft" && ctx.activeProject) {
        const { prev } = getAdjacentProjectIds(
          ctx.streamSlots,
          ctx.activeProject.id
        );
        if (prev) {
          e.preventDefault();
          ctx.selectProject(prev);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!hydrated) {
    return <LoadingShell />;
  }

  if (!activeProject || streamSlots.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <JudgingHeader
          judgedCount={0}
          skippedCount={0}
          totalCount={0}
          streamName={activeStream?.shortName ?? activeStream?.name}
          streams={streams}
          activeStreamId={activeStreamId}
          progressByStream={progressByStream}
          onSelectStream={persistAndSwitchStream}
          streamLocked={streamLocked}
        />
        <div className="mx-auto flex max-w-lg flex-1 flex-col justify-center px-6 py-24 text-center">
          <h2 className="font-[family-name:var(--j-font-display)] text-3xl font-semibold tracking-tight text-[var(--j-ink)]">
            Nothing scheduled
          </h2>
          <p className="mt-4 font-[family-name:var(--j-font-body)] text-lg leading-relaxed text-[var(--j-muted)]">
            {streamLocked
              ? "No projects are assigned to this stream yet."
              : streams.length > 1
                ? "Pick another stream in the header, or wait until projects are assigned to this block."
                : "Your judging block will show up here once projects are assigned."}
          </p>
        </div>
      </div>
    );
  }

  const skipPickerProject = skipPickerProjectId
    ? projects.find((p) => p.id === skipPickerProjectId)
    : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ReviewStamp trigger={reviewStampTrigger} />
      <WinnerBurst trigger={winnerBurstTrigger} />
      <JudgingHeader
        judgedCount={judgedCount}
        skippedCount={skippedCount}
        totalCount={totalCount}
        streamName={activeStream?.shortName ?? activeStream?.name}
        syncStatus={syncStatus}
        pendingSyncCount={pendingCount}
        pendingSummary={pendingSummary}
        scheduleOffsetLabel={scheduleOffsetLabel}
        streams={streams}
        activeStreamId={activeStreamId}
        progressByStream={progressByStream}
        onSelectStream={persistAndSwitchStream}
        streamLocked={streamLocked}
      />

      {streamAllDone && activeStream && (
        <CompletionBanner
          judgedCount={judgedCount}
          skippedCount={skippedCount}
          totalCount={totalCount}
          streamName={activeStream.name}
          onResetStream={() => setShowResetConfirm(true)}
        />
      )}

      {showResetConfirm && activeStream && (
        <div className="border-b border-[var(--hc-border)] bg-[var(--hc-white)] px-4 py-3 text-[var(--hc-ink)] sm:px-10">
          <ResetStreamConfirm
            streamName={activeStream.name}
            judgedTotal={judgedIds.size}
            onConfirm={confirmResetStream}
            onCancel={() => setShowResetConfirm(false)}
          />
        </div>
      )}

      {breakState && breakNextProject && !showLiveRibbon && (
        <BreakBanner
          breakState={breakState}
          nextProject={breakNextProject}
          onGoToNext={() => selectProject(breakState.nextProjectId)}
        />
      )}

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
        notScheduled={notScheduled}
        multipleSlots={multipleSlots}
        nowMs={adjustedNow}
      />

      <div className="j-content">
        <div className="j-content-grid">
          <div className="j-main-col min-w-0">
            <ProjectDetails project={activeProject} />
            <JudgeNotesPanel
              project={activeProject}
              notes={notes[activeProject.id] ?? ""}
              onChange={updateNotes}
              syncStatus={syncStatus}
              pendingNotesCount={pendingSummary.notesOnly}
              rating={ratings[activeProject.id] ?? null}
              onRate={(value) => rateProject(activeProject.id, value)}
            />
          </div>

          <aside className="j-rail-col hidden lg:block">
            <div className="j-rail-stack">
              <DelayControl
                offsetMinutes={scheduleOffsetMinutes}
                onApplied={handleOffsetChange}
                collapsible
              />
              <SessionRail
                slots={streamSlots}
                projects={projects}
                activeProjectId={activeProject.id}
                judgedIds={judgedIds}
                skippedIds={skippedIds}
                winnerIds={winnerIds}
                onSelect={selectProject}
                scheduleApproximate={scheduleApproximate}
              />
            </div>
          </aside>
        </div>
      </div>

      <div className="j-bottom-chrome">
        <ScheduleDock
          slots={streamSlots}
          projects={projects}
          activeProjectId={activeProject.id}
          judgedIds={judgedIds}
          skippedIds={skippedIds}
          winnerIds={winnerIds}
          judgedCount={judgedCount}
          skippedCount={skippedCount}
          totalCount={totalCount}
          onSelect={selectProject}
          scheduleApproximate={scheduleApproximate}
          delayControl={
            <DelayControl
              offsetMinutes={scheduleOffsetMinutes}
              onApplied={handleOffsetChange}
              embedded
            />
          }
        />

        <footer className="j-footer">
          {feedback && (
            <ActionFeedback
              message={feedback.message}
              detail={feedback.detail}
              actionLabel={feedback.actionLabel}
              onAction={feedback.onAction}
              onDismiss={() => setFeedback(null)}
            />
          )}
          <div className="j-footer-inner">
            {skipPickerProject ? (
              <SkipReasonPicker
                projectName={skipPickerProject.name}
                selected={pendingSkipReason}
                onSelect={setPendingSkipReason}
                onConfirm={() =>
                  completeJudging(skipPickerProject.id, "skipped", pendingSkipReason)
                }
                onCancel={() => {
                  setSkipPickerProjectId(null);
                  setPendingSkipReason(null);
                }}
              />
            ) : (
              <JudgingFooter
                isJudged={isJudged}
                isSkipped={isSkipped}
                isWinner={winnerIds.has(activeProject.id)}
                activeSlotLive={activeSlot?.status === "live"}
                notScheduled={notScheduled}
                onSkip={() => startSkipFlow(activeProject.id)}
                onReviewed={() => completeJudging(activeProject.id, "reviewed")}
                onUnmark={() => unmarkWithToast(activeProject.id)}
                onToggleWinner={() => toggleWinner(activeProject.id)}
              />
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
