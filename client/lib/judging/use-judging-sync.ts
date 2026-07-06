"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchScheduleOffset,
  flushJudgmentQueue,
  getPendingCount,
  getPendingSummary,
  type PendingSummary,
} from "@/lib/judging/offline-queue";

export type SyncStatus = "synced" | "pending" | "offline" | "syncing";

export function useJudgingSync(onOffsetChange?: (minutes: number) => void) {
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingSummary, setPendingSummary] = useState<PendingSummary>({
    total: 0,
    marks: 0,
    notesOnly: 0,
  });
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(() => {
    setPendingCount(getPendingCount());
    setPendingSummary(getPendingSummary());
  }, []);

  const syncNow = useCallback(async () => {
    refreshPending();
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
      await flushJudgmentQueue();
      refreshPending();
    } finally {
      setSyncing(false);
    }
  }, [refreshPending]);

  const refreshOffset = useCallback(async () => {
    const minutes = await fetchScheduleOffset();
    onOffsetChange?.(minutes);
    return minutes;
  }, [onOffsetChange]);

  useEffect(() => {
    refreshPending();
    void syncNow();
    void refreshOffset();

    function goOnline() {
      setOnline(true);
      void syncNow();
      void refreshOffset();
    }
    function goOffline() {
      setOnline(false);
    }

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    const syncInterval = window.setInterval(() => {
      void syncNow();
    }, 30_000);

    const offsetInterval = window.setInterval(() => {
      void refreshOffset();
    }, 60_000);

    function onFocus() {
      void refreshOffset();
      void syncNow();
    }
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(syncInterval);
      window.clearInterval(offsetInterval);
    };
  }, [syncNow, refreshOffset, refreshPending]);

  const status: SyncStatus = syncing
    ? "syncing"
    : !online
      ? pendingCount > 0
        ? "offline"
        : "offline"
      : pendingCount > 0
        ? "pending"
        : "synced";

  return {
    online,
    pendingCount,
    pendingSummary,
    status,
    syncNow,
    refreshPending,
    refreshOffset,
  };
}
