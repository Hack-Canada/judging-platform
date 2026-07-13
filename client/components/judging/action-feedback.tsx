"use client";

import { Button } from "@/components/ui/button";

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
          <p className="font-medium text-secondary-foreground">{message}</p>
          {detail && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{detail}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {actionLabel && onAction && (
            <Button type="button" variant="link" size="sm" onClick={onAction} className="text-[var(--j-action)]">
              {actionLabel}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-muted-foreground"
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  );
}
