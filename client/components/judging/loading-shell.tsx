export function LoadingShell() {
  return (
    <div
      className="judging-shell flex min-h-dvh flex-col"
      aria-busy="true"
      aria-label="Loading judge desk"
    >
      <div className="border-b border-[var(--j-border)] bg-[var(--j-paper)] px-5 py-4 sm:px-10">
        <div className="mx-auto flex w-full max-w-screen-2xl justify-between px-8 lg:px-12">
          <div className="h-10 w-40 animate-pulse rounded bg-[var(--j-border)]" />
          <div className="h-10 w-16 animate-pulse rounded bg-[var(--j-border)]" />
        </div>
      </div>
      <div className="j-hero flex-1">
        <div className="j-hero-inner">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="h-32 w-48 animate-pulse rounded bg-[rgb(245_243_239/0.12)]" />
            <div className="space-y-4">
              <div className="h-12 w-3/4 animate-pulse rounded bg-[rgb(245_243_239/0.12)]" />
              <div className="h-6 w-1/2 animate-pulse rounded bg-[rgb(245_243_239/0.08)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
