"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Shift } from "@/app/volunteer/types";

const POLL_MS = 5000;

/**
 * Live volunteer shifts via polling, mirroring hooks/use-live-schedule.ts's
 * approach for the judging schedule: every viewer polls GET
 * /api/volunteer/shifts on an interval so an assignment change made by an
 * organizer shows up here within a few seconds, without a manual refresh.
 *
 * Polling pauses while the tab is hidden.
 */
export function useLiveShifts(initialShifts: Shift[]) {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [lastSync, setLastSync] = useState<number>(() => Date.now());
  const pausedRef = useRef(false);

  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/volunteer/shifts", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.shifts)) {
        setShifts(data.shifts as Shift[]);
        setLastSync(Date.now());
      }
    } catch {
      // Transient network error — keep current state and try again next tick.
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (pausedRef.current) return;
      if (typeof document !== "undefined" && document.hidden) return;
      void refresh();
    };
    const timer = setInterval(tick, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { shifts, refresh, setPaused, lastSync };
}
