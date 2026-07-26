"use client";

import { Button, Card } from "@/components/design-system";

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
      <Card className="j-action-feedback-inner pointer-events-auto mx-auto max-w-md p-3 shadow-[var(--hc-shadow)] sm:p-4">
        <div className="min-w-0">
          <p className="font-medium text-[var(--hc-ink)]">{message}</p>
          {detail && (
            <p className="mt-0.5 truncate text-sm text-[var(--hc-muted)]">{detail}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actionLabel && onAction && (
            <Button
              type="button"
              variant="secondary"
              onClick={onAction}
              className="min-h-10 px-3 text-sm"
            >
              {actionLabel}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="min-h-10 min-w-10 px-0 text-lg leading-none text-[var(--hc-muted)]"
          >
            ×
          </Button>
        </div>
      </Card>
    </div>
  );
}
