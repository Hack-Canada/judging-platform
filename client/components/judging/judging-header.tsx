"use client";

import Link from "next/link";
import type { ReactNode } from "react";
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
  /** When set and not locked, show stream dropdown in the breadcrumb row. */
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
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const showStreamSelect =
    !streamLocked &&
    streams &&
    streams.length > 1 &&
    activeStreamId &&
    progressByStream &&
    onSelectStream;

  const context = (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="text-[var(--j-muted)]">{EVENT_NAME}</span>
      {showStreamSelect ? (
        <>
          <span className="text-[var(--j-faint)]" aria-hidden>
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
        <span className="text-[var(--j-faint)]"> · {streamName}</span>
      ) : null}
      <span className="text-[var(--j-faint)]"> · live</span>
    </span>
  );

  const status = (
    <div className="j-header-status">
      <div className="j-header-progress-block">
        <p className="j-header-count">
          {judgedCount}
          <span className="j-header-count-total">/{totalCount}</span>
        </p>
        <p className="mt-0.5 text-xs font-medium text-[var(--j-muted)]">judged</p>
        {skippedCount > 0 && (
          <p className="mt-0.5 text-xs text-[var(--j-faint)]">{skippedCount} skipped</p>
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
      <JudgingAppHeader
        leading={
          <Link href="/" className="j-header-back">
            ← Portals
          </Link>
        }
        portalName="Judge desk"
        context={context}
        status={status}
        middle={
          totalCount > 0 ? (
            <div
              className="j-header-mid-progress"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${judgedCount} judged, ${skippedCount} skipped, ${totalCount} total`}
            >
              <div
                className="j-header-mid-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          ) : null
        }
      />
    </div>
  );
}

/** Judging-only chrome — not shared across portals. */
function JudgingAppHeader({
  portalName,
  context,
  leading,
  middle,
  status,
}: {
  portalName: string;
  context?: ReactNode;
  leading?: ReactNode;
  middle?: ReactNode;
  status?: ReactNode;
}) {
  return (
    <header className="j-app-header">
      <div className="j-app-header-inner">
        <div className="j-app-header-left">
          {leading ? <div className="j-app-header-leading">{leading}</div> : null}
          <div className="min-w-0">
            {context ? <div className="j-app-header-context">{context}</div> : null}
            <p className="j-app-header-title">{portalName}</p>
          </div>
        </div>
        {middle != null ? (
          <div className="j-app-header-middle">{middle}</div>
        ) : (
          <div className="j-app-header-middle" aria-hidden />
        )}
        {status ? <div className="j-app-header-status">{status}</div> : null}
      </div>
    </header>
  );
}
