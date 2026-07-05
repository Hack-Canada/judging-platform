"use client";

import type { SyncStatus } from "@/lib/judging/use-judging-sync";

type SyncStatusProps = {
  status: SyncStatus;
  pendingCount: number;
  scheduleOffsetLabel?: string | null;
};

const LABELS: Record<SyncStatus, string> = {
  synced: "Synced",
  pending: "Sync pending",
  offline: "Offline — saved on device",
  syncing: "Syncing…",
};

export function SyncStatusBadge({
  status,
  pendingCount,
  scheduleOffsetLabel,
}: SyncStatusProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {scheduleOffsetLabel && (
        <span className="j-sync-badge j-sync-badge--offset">{scheduleOffsetLabel}</span>
      )}
      <span
        className={`j-sync-badge j-sync-badge--${status}`}
        title={
          pendingCount > 0
            ? `${pendingCount} judgment${pendingCount === 1 ? "" : "s"} waiting to sync`
            : LABELS[status]
        }
      >
        {status === "pending" || status === "offline"
          ? `${LABELS[status]}${pendingCount > 0 ? ` (${pendingCount})` : ""}`
          : LABELS[status]}
      </span>
    </div>
  );
}
