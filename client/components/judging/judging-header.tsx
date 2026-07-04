"use client";

import Link from "next/link";
import { EVENT_NAME } from "@/lib/judging/constants";
import type { DataSource, MockReason } from "@/lib/judging/types";

type JudgingHeaderProps = {
  dataSource: DataSource;
  mockReason?: MockReason;
  judgedCount: number;
  totalCount: number;
};

export function JudgingHeader({
  dataSource,
  mockReason,
  judgedCount,
  totalCount,
}: JudgingHeaderProps) {
  const isProdMock =
    process.env.NODE_ENV === "production" && dataSource === "mock";

  return (
    <>
      {isProdMock && (
        <div
          className="j-mock-banner"
          role="alert"
        >
          Demo data loaded — real projects could not be fetched
          {mockReason === "error" && " (database error)"}.
          Do not judge from this screen. Contact an organizer.
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
                {dataSource === "mock" && process.env.NODE_ENV !== "production" && (
                  <span className="text-[var(--j-faint)]"> · preview data</span>
                )}
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
          </div>
        </div>
      </header>
    </>
  );
}
