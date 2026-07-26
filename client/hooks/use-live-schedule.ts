"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScheduleSlot } from "@/lib/schedule";

const POLL_MS = 5000;

/**
 * Live pitch schedule via polling. Neon has no native realtime, so every
 * viewer polls `GET /api/schedule` on an interval and updates in place — this
 * is what makes an admin's edit appear for other admins and for hackers within
 * a few seconds.
 *
 * Polling pauses while a local mutation is in flight (so a poll can't clobber
 * an optimistic edit with stale data) and while the tab is hidden.
 */
export function useLiveSchedule(initialSlots: ScheduleSlot[]) {
  const [slots, setSlots] = useState<ScheduleSlot[]>(initialSlots);
  const [lastSync, setLastSync] = useState<number>(() => Date.now());
  const [loaded, setLoaded] = useState(initialSlots.length > 0);
  const pausedRef = useRef(false);

  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.slots)) {
        setSlots(data.slots as ScheduleSlot[]);
        setLastSync(Date.now());
        setLoaded(true);
      }
    } catch {
      // Transient network error — keep current state and try again next tick.
    }
  }, []);

  // Confirm against the server once on mount (also seeds views that start
  // empty, like the hacker schedule), then keep polling.
  useEffect(() => {
    void refresh();
    const tick = () => {
      if (pausedRef.current) return;
      if (typeof document !== "undefined" && document.hidden) return;
      void refresh();
    };
    const timer = setInterval(tick, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { slots, setSlots, refresh, setPaused, lastSync, loaded };
}
