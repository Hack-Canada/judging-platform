type CompletionBannerProps = {
  judgedCount: number;
  skippedCount?: number;
  totalCount: number;
  streamName: string;
  onResetStream: () => void;
};

export function CompletionBanner({
  judgedCount,
  skippedCount = 0,
  totalCount,
  streamName,
  onResetStream,
}: CompletionBannerProps) {
  const progressLabel =
    skippedCount > 0
      ? `${judgedCount} judged · ${skippedCount} skipped`
      : `${judgedCount} judged`;

  return (
    <section className="j-completion-banner" aria-live="polite">
      <div className="j-completion-banner-inner">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--j-ink)]">
            Stream complete — {progressLabel} of {totalCount}
          </p>
          <p className="mt-0.5 text-sm text-[var(--j-muted)]">
            {streamName}. You can still review projects or unmark mistakes below.
          </p>
        </div>
        <button type="button" onClick={onResetStream} className="j-completion-reset">
          Reset stream
        </button>
      </div>
    </section>
  );
}
