"use client";

import { useMemo } from "react";
import { Radio, MapPin, Loader2 } from "lucide-react";
import { useLiveSchedule } from "@/hooks/use-live-schedule";
import type { ScheduleSlot } from "@/lib/schedule";

// Read-only, live view of the judging pitch schedule for hackers. Reads the
// same `schedule_slots` the admin edits (via GET /api/schedule) and polls, so
// an admin's change — a delay, a room move — shows up here within seconds.
// Additive to the static event timeline on this page; does not replace it.

function fmtTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

type TimeGroup = { key: string; time: string; pitches: ScheduleSlot[] };

export function LiveJudgingSchedule() {
  const { slots, loaded } = useLiveSchedule([]);

  const groups = useMemo<TimeGroup[]>(() => {
    const map = new Map<string, TimeGroup>();
    for (const s of slots) {
      const g = map.get(s.scheduledAt);
      if (g) g.pitches.push(s);
      else
        map.set(s.scheduledAt, {
          key: s.scheduledAt,
          time: s.scheduledAt,
          pitches: [s],
        });
    }
    for (const g of map.values())
      g.pitches.sort((a, b) => a.room.localeCompare(b.room));
    return [...map.values()].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );
  }, [slots]);

  return (
    <section className="rounded-[1.5rem] border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] p-4 shadow-[0_10px_24px_rgba(15,42,67,0.06)] sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="[font-family:var(--font-jetbrains-mono)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
            When you pitch
          </p>
          <h2 className="[font-family:var(--font-figtree)] text-2xl font-black text-[var(--brand-secondary)]">
            Judging Schedule
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <Radio className="size-3.5 animate-pulse" />
          Live
        </span>
      </header>

      {!loaded ? (
        <div className="flex items-center gap-2 py-10 text-sm text-[var(--text-secondary)]">
          <Loader2 className="size-4 animate-spin" /> Loading schedule…
        </div>
      ) : groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--text-secondary)]">
          The judging schedule hasn&apos;t been published yet. Check back soon.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div
              key={g.key}
              className="grid grid-cols-[64px_1fr] gap-3 border-t border-[var(--bg-gray)] pt-3 first:border-t-0 first:pt-0 sm:grid-cols-[84px_1fr]"
            >
              <div className="[font-family:var(--font-figtree)] text-sm font-bold text-[var(--brand-secondary)]">
                {fmtTime(g.time)}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {g.pitches.map((s) => (
                  <article
                    key={s.id}
                    className="rounded-xl border-2 border-[color:var(--brand-primary)]/25 bg-[var(--bg-primary-light)]/40 p-2.5"
                  >
                    <h3 className="[font-family:var(--font-figtree)] text-[13px] font-semibold leading-tight text-[var(--brand-secondary)]">
                      {s.projectName}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 [font-family:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                      <MapPin className="size-3" />
                      {s.room}
                      <span className="opacity-60">· {s.track}</span>
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
