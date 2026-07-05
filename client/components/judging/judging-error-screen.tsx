"use client";

type JudgingErrorScreenProps = {
  message?: string;
};

export function JudgingErrorScreen({
  message = "Could not load judging data. Check your connection and try again.",
}: JudgingErrorScreenProps) {
  function handleRetry() {
    window.location.reload();
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--j-paper)] px-6 py-24 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--j-faint)]">
          Judge desk
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--j-ink)]">
          Could not load schedule
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[var(--j-muted)]">{message}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="j-cta j-cta--primary mt-8 w-full sm:w-auto"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
