"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScheduleEvent } from "@/db/queries";

const POLL_MS = 5000;

/**
 * Live sponsor schedule via polling, mirroring hooks/use-live-schedule.ts's
 * approach for the judging schedule: every viewer polls GET
 * /api/sponsor/schedule on an interval so a new/changed booth assignment
 * shows up here within a few seconds, without a manual refresh.
 *
 * Polling pauses while the tab is hidden.
 */
export function useLiveSponsorSchedule(initialEvents: ScheduleEvent[]) {
  const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents);
  const [lastSync, setLastSync] = useState<number>(() => Date.now());
  const pausedRef = useRef(false);

  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/sponsor/schedule", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.events)) {
        setEvents(data.events as ScheduleEvent[]);
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

  return { events, refresh, setPaused, lastSync };
}
