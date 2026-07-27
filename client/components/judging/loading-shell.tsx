export function LoadingShell() {
  return (
    <div
      className="judging-shell flex min-h-dvh flex-col"
      aria-busy="true"
      aria-label="Loading judge desk"
    >
      <div className="border-b border-[var(--hc-border)] bg-[var(--hc-paper)] px-4 py-4 sm:px-10">
        <div className="mx-auto flex w-full max-w-screen-2xl justify-between px-0 sm:px-8 lg:px-12">
          <div className="h-10 w-32 animate-pulse rounded-[var(--hc-radius)] bg-[var(--hc-border)] sm:w-40" />
          <div className="h-10 w-14 animate-pulse rounded-[var(--hc-radius)] bg-[var(--hc-border)] sm:w-16" />
        </div>
      </div>
      <div className="j-hero flex-1">
        <div className="j-hero-inner">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            <div className="h-28 w-40 animate-pulse rounded-[var(--hc-radius)] bg-[rgb(255_255_255/0.12)] sm:h-32 sm:w-48" />
            <div className="space-y-3 sm:space-y-4">
              <div className="h-10 w-3/4 animate-pulse rounded-[var(--hc-radius)] bg-[rgb(255_255_255/0.12)] sm:h-12" />
              <div className="h-5 w-1/2 animate-pulse rounded-[var(--hc-radius)] bg-[rgb(255_255_255/0.08)] sm:h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
