"use client";

import type { PendingSummary } from "@/lib/judging/offline-queue";
import type { SyncStatus } from "@/lib/judging/use-judging-sync";

type SyncStatusProps = {
  status: SyncStatus;
  pendingCount: number;
  pendingSummary?: PendingSummary;
  scheduleOffsetLabel?: string | null;
};

const LABELS: Record<SyncStatus, string> = {
  synced: "Synced",
  pending: "Sync pending",
  offline: "Offline - saved on device",
  syncing: "Syncing...",
};

function pendingTooltip(count: number, summary?: PendingSummary): string {
  if (!summary || summary.total !== count) {
    return `${count} item${count === 1 ? "" : "s"} waiting to sync`;
  }
  const parts: string[] = [];
  if (summary.marks > 0) {
    parts.push(`${summary.marks} mark${summary.marks === 1 ? "" : "s"}`);
  }
  if (summary.notesOnly > 0) {
    parts.push(`${summary.notesOnly} note${summary.notesOnly === 1 ? "" : "s"}`);
  }
  return parts.length ? `${parts.join(", ")} waiting to sync` : `${count} items waiting to sync`;
}

export function SyncStatusBadge({
  status,
  pendingCount,
  pendingSummary,
  scheduleOffsetLabel,
}: SyncStatusProps) {
  return (
    <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
      {scheduleOffsetLabel && (
        <span
          className="j-sync-badge j-sync-badge--offset"
          title="Organizer schedule delay. Slot times are shifted on this desk."
        >
          Running {scheduleOffsetLabel}
        </span>
      )}
      <span
        className={`j-sync-badge j-sync-badge--${status}`}
        title={
          pendingCount > 0 ? pendingTooltip(pendingCount, pendingSummary) : LABELS[status]
        }
      >
        {status === "pending" || status === "offline"
          ? `${LABELS[status]}${pendingCount > 0 ? ` (${pendingCount})` : ""}`
          : LABELS[status]}
      </span>
    </div>
  );
}
