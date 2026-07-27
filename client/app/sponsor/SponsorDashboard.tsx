"use client";

import { useEffect, useState } from "react";

import { EventListItem } from "@/components/schedule/event-list-item";
import { ViewToggle, type ScheduleView } from "@/components/schedule/view-toggle";
import { EventCalendar } from "@/components/schedule/event-calendar";
import { useLiveSponsorSchedule } from "@/app/sponsor/use-live-schedule";
import type { ScheduleEvent } from "@/db/queries";

export function SponsorDashboard({ events: initialEvents }: { events: ScheduleEvent[] }) {
  const { events: allEvents, lastSync } = useLiveSponsorSchedule(initialEvents);
  const [view, setView] = useState<ScheduleView>("list");
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.max(0, Math.round((Date.now() - lastSync) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSync]);

  const events = allEvents.filter((event) => event.assignments.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[color:var(--bg-gray-dark)]/55 bg-[var(--bg-white)] px-4 pb-5 pt-5 sm:px-6 sm:py-7">
        <h1 className="[font-family:var(--font-fredoka)] text-2xl font-semibold tracking-[-0.02em] text-[var(--brand-secondary)]">
          Sponsor Dashboard
        </h1>
        <p className="mt-1 [font-family:var(--font-figtree)] text-sm text-[var(--text-secondary)]">
          Everything you need for the event!
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--bg-gray)] px-4 py-5 sm:px-6 sm:py-7">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="[font-family:var(--font-jetbrains-mono)] text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Your Events
            </h2>
            <span className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              Live · updated {secondsAgo}s ago
            </span>
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>
        {events.length === 0 ? (
          <p className="[font-family:var(--font-figtree)] text-sm text-[var(--text-secondary)]">
            You have no events assigned yet.
          </p>
        ) : view === "list" ? (
          <div className="flex flex-col gap-2">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="hacker-card-enter"
                style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
              >
                <EventListItem {...event} />
              </div>
            ))}
          </div>
        ) : (
          <EventCalendar items={events} />
        )}
      </div>
    </div>
  );
}
