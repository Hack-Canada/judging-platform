"use client";

type ActionFeedbackProps = {
  message: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
};

export function ActionFeedback({
  message,
  detail,
  actionLabel,
  onAction,
  onDismiss,
}: ActionFeedbackProps) {
  return (
    <div className="j-action-feedback" role="status" aria-live="polite">
      <div className="j-action-feedback-inner">
        <div className="min-w-0">
          <p className="font-medium text-[var(--j-ink)]">{message}</p>
          {detail && (
            <p className="mt-0.5 truncate text-sm text-[var(--j-muted)]">{detail}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {actionLabel && onAction && (
            <button type="button" onClick={onAction} className="j-action-feedback-btn">
              {actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="j-action-feedback-dismiss"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
