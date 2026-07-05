"use client";

import Link from "next/link";
import { SyncStatusBadge } from "@/components/judging/sync-status";
import { EVENT_NAME } from "@/lib/judging/constants";
import { hasAttributableJudge } from "@/lib/judging/judge-identity";
import type { SyncStatus } from "@/lib/judging/use-judging-sync";
import type { DataSource, MockReason } from "@/lib/judging/types";

type JudgingHeaderProps = {
  dataSource: DataSource;
  mockReason?: MockReason;
  judgedCount: number;
  skippedCount?: number;
  totalCount: number;
  streamName?: string;
  judgeId?: string;
  syncStatus?: SyncStatus;
  pendingSyncCount?: number;
  scheduleOffsetLabel?: string | null;
};

export function JudgingHeader({
  dataSource,
  mockReason,
  judgedCount,
  skippedCount = 0,
  totalCount,
  streamName,
  judgeId,
  syncStatus,
  pendingSyncCount = 0,
  scheduleOffsetLabel,
}: JudgingHeaderProps) {
  const isProdMock =
    process.env.NODE_ENV === "production" && dataSource === "mock";
  const completedCount = judgedCount + skippedCount;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const showJudgeNotice = judgeId !== undefined && !hasAttributableJudge(judgeId);

  return (
    <>
      {isProdMock && (
        <div className="j-mock-banner" role="alert">
          Demo data loaded — real projects could not be fetched
          {mockReason === "error" && " (database error)"}.
          Do not judge from this screen. Contact an organizer.
        </div>
      )}
      {showJudgeNotice && (
        <div className="j-judge-notice" role="status">
          No judge code — marks will not be attributed. Add{" "}
          <code className="rounded bg-[var(--j-paper)] px-1 py-0.5 text-xs">?code=J42</code> to
          your link.
        </div>
      )}
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
                {dataSource === "database" && (
                  <span className="text-[var(--j-faint)]"> · live</span>
                )}
                {dataSource === "mock" && process.env.NODE_ENV !== "production" && (
                  <span className="text-[var(--j-faint)]"> · preview</span>
                )}
              </p>
              <p className="text-base font-semibold text-[var(--j-ink)]">Judge desk</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums leading-none text-[var(--j-ink)]">
              {judgedCount}
              {skippedCount > 0 && (
                <span className="text-lg font-medium text-[var(--j-faint)]">
                  {" "}
                  · {skippedCount} skipped
                </span>
              )}
              <span className="text-lg font-medium text-[var(--j-faint)]">/{totalCount}</span>
            </p>
            <p className="mt-0.5 text-xs font-medium text-[var(--j-muted)]">
              {skippedCount > 0 ? `${judgedCount} judged · ${skippedCount} skipped` : "judged"}
            </p>
            {syncStatus && (
              <div className="mt-2">
                <SyncStatusBadge
                  status={syncStatus}
                  pendingCount={pendingSyncCount}
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
            aria-label={`${completedCount} of ${totalCount} projects complete`}
          >
            <div className="j-header-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </header>
    </>
  );
}
