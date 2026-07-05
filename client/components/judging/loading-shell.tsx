export function LoadingShell() {
  return (
    <div className="flex min-h-dvh flex-col" aria-busy="true" aria-label="Loading judge desk">
      <div className="border-b border-[var(--j-border)] bg-[var(--j-white)] px-5 py-4 sm:px-10">
        <div className="mx-auto flex max-w-[80rem] justify-between">
          <div className="h-10 w-40 animate-pulse rounded bg-[var(--j-border)]" />
          <div className="h-10 w-16 animate-pulse rounded bg-[var(--j-border)]" />
        </div>
      </div>
      <div className="j-hero flex-1">
        <div className="j-hero-inner">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="h-32 w-48 animate-pulse rounded bg-[rgb(245_243_239/0.08)]" />
            <div className="space-y-4">
              <div className="h-12 w-3/4 animate-pulse rounded bg-[rgb(245_243_239/0.08)]" />
              <div className="h-6 w-1/2 animate-pulse rounded bg-[rgb(245_243_239/0.06)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
