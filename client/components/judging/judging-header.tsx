"use client";

import { AppHeader, AppHeaderBack } from "@/components/design-system";
import { BoardingProgress } from "@/components/judging/boarding-progress";
import { StreamSelector } from "@/components/judging/stream-selector";
import { SyncStatusBadge } from "@/components/judging/sync-status";
import { EVENT_NAME } from "@/lib/judging/constants";
import type { PendingSummary } from "@/lib/judging/offline-queue";
import type { JudgingStream } from "@/lib/judging/types";
import type { SyncStatus } from "@/lib/judging/use-judging-sync";

type JudgingHeaderProps = {
  judgedCount: number;
  skippedCount?: number;
  totalCount: number;
  streamName?: string;
  syncStatus?: SyncStatus;
  pendingSyncCount?: number;
  pendingSummary?: PendingSummary;
  scheduleOffsetLabel?: string | null;
  streams?: JudgingStream[];
  activeStreamId?: string;
  progressByStream?: Record<
    string,
    { judged: number; skipped: number; total: number }
  >;
  onSelectStream?: (streamId: string) => void;
  streamLocked?: boolean;
};

export function JudgingHeader({
  judgedCount,
  skippedCount = 0,
  totalCount,
  streamName,
  syncStatus,
  pendingSyncCount = 0,
  pendingSummary,
  scheduleOffsetLabel,
  streams,
  activeStreamId,
  progressByStream,
  onSelectStream,
  streamLocked = false,
}: JudgingHeaderProps) {
  const completedCount = judgedCount + skippedCount;

  const showStreamSelect =
    !streamLocked &&
    streams &&
    streams.length > 1 &&
    activeStreamId &&
    progressByStream &&
    onSelectStream;

  const context = (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="text-[var(--hc-muted)]">{EVENT_NAME}</span>
      {showStreamSelect ? (
        <>
          <span className="text-[var(--hc-faint)]" aria-hidden>
            ·
          </span>
          <StreamSelector
            streams={streams}
            activeStreamId={activeStreamId}
            progressByStream={progressByStream}
            onSelect={onSelectStream}
          />
        </>
      ) : streamName ? (
        <span className="text-[var(--hc-faint)]"> · {streamName}</span>
      ) : null}
      <span className="hidden text-[var(--hc-faint)] sm:inline"> · live</span>
    </span>
  );

  const status = (
    <div className="j-header-status">
      <div className="j-header-progress-block">
        <p className="j-header-count">
          {judgedCount}
          <span className="j-header-count-total">/{totalCount}</span>
        </p>
        <p className="mt-0.5 text-xs font-medium text-[var(--hc-muted)]">judged</p>
        {skippedCount > 0 && (
          <p className="mt-0.5 text-xs text-[var(--hc-faint)]">{skippedCount} skipped</p>
        )}
      </div>
      {syncStatus ? (
        <SyncStatusBadge
          status={syncStatus}
          pendingCount={pendingSyncCount}
          pendingSummary={pendingSummary}
          scheduleOffsetLabel={scheduleOffsetLabel}
        />
      ) : null}
    </div>
  );

  return (
    <div>
      <AppHeader
        className="j-judging-header"
        leading={<AppHeaderBack />}
        portalName="Judge desk"
        context={context}
        status={status}
        middle={
          totalCount > 0 ? (
            <BoardingProgress
              completed={completedCount}
              total={totalCount}
              judged={judgedCount}
              skipped={skippedCount}
            />
          ) : null
        }
      />
    </div>
  );
}
