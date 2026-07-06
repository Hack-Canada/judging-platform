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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-primary px-6 py-24 text-center text-primary-foreground">
      <div className="w-full max-w-md space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/60">
          Judge desk
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Could not load schedule</h1>
        <p className="text-lg leading-relaxed text-primary-foreground/80">{message}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="j-cta mt-6 w-full sm:w-auto"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
