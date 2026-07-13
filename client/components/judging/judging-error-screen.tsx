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
    <div className="judging-shell flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center">
      <div className="w-full max-w-md space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--j-muted)]">
          Judge desk
        </p>
        <h1 className="font-[family-name:var(--j-font-display)] text-3xl font-semibold tracking-tight text-[var(--j-ink)]">
          Could not load schedule
        </h1>
        <p className="text-lg leading-relaxed text-[var(--j-muted)]">{message}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="j-cta j-cta--primary mt-6 w-full sm:w-auto"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
