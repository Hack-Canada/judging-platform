import { Button } from "@/components/design-system";

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
          <p className="font-[family-name:var(--hc-font-display)] font-semibold text-[var(--hc-ink)]">
            Stream complete - {progressLabel} of {totalCount}
          </p>
          <p className="mt-0.5 text-sm text-[var(--hc-muted)]">
            {streamName}. You can still review projects or unmark mistakes below.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={onResetStream}
          className="min-h-10 shrink-0 px-3 text-sm"
        >
          Reset stream
        </Button>
      </div>
    </section>
  );
}
