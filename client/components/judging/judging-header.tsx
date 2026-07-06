"use client";

import Link from "next/link";
import { SyncStatusBadge } from "@/components/judging/sync-status";
import { EVENT_NAME } from "@/lib/judging/constants";
import type { PendingSummary } from "@/lib/judging/offline-queue";
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
}: JudgingHeaderProps) {
  const completedCount = judgedCount + skippedCount;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="border-b border-[var(--j-border)] bg-[var(--j-white)]">
      <div className="mx-auto flex max-w-[80rem] items-center justify-between gap-6 px-5 py-4 sm:px-10">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className="hidden text-sm font-medium text-[var(--j-muted)] hover:text-[var(--j-ink)] sm:inline"
          >
            ← Portals
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--j-muted)]">
              {EVENT_NAME}
              {streamName && (
                <span className="text-[var(--j-faint)]"> · {streamName}</span>
              )}
              <span className="text-[var(--j-faint)]"> · live</span>
            </p>
            <p className="text-base font-semibold text-[var(--j-ink)]">Judge desk</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums leading-none text-[var(--j-ink)]">
            {judgedCount}
            <span className="text-lg font-medium text-[var(--j-faint)]">/{totalCount}</span>
          </p>
          <p className="mt-0.5 text-xs font-medium text-[var(--j-muted)]">judged</p>
          {skippedCount > 0 && (
            <p className="mt-0.5 text-xs text-[var(--j-faint)]">{skippedCount} skipped</p>
          )}
          {syncStatus && (
            <div className="mt-2">
              <SyncStatusBadge
                status={syncStatus}
                pendingCount={pendingSyncCount}
                pendingSummary={pendingSummary}
                scheduleOffsetLabel={scheduleOffsetLabel}
              />
            </div>
          )}
        </div>
      </div>
      {totalCount > 0 && (
        <div
          className="j-header-progress"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${judgedCount} judged, ${skippedCount} skipped, ${totalCount} total`}
        >
          <div className="j-header-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      )}
    </header>
  );
}
