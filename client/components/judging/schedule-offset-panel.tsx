"use client";

import { useState } from "react";
import { publishScheduleOffset } from "@/lib/judging/offline-queue";
import { formatOffsetLabel } from "@/lib/judging/schedule-offset";

type ScheduleOffsetPanelProps = {
  initialOffset: number;
  onOffsetChange: (minutes: number) => void;
};

export function ScheduleOffsetPanel({
  initialOffset,
  onOffsetChange,
}: ScheduleOffsetPanelProps) {
  const [value, setValue] = useState(String(initialOffset));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const minutes = Number(value) || 0;
      const applied = await publishScheduleOffset(minutes);
      onOffsetChange(applied);
      setValue(String(applied));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const preview = formatOffsetLabel(Number(value) || 0);

  return (
    <section className="j-organizer-panel" aria-label="Schedule slip controls">
      <div className="j-organizer-panel-inner">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--j-ink)]">Schedule slip</p>
          <p className="mt-0.5 text-sm text-[var(--j-muted)]">
            Positive minutes = event running behind. All judges see shifted times.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="schedule-offset-input">
            Minutes behind schedule
          </label>
          <input
            id="schedule-offset-input"
            type="number"
            min={-180}
            max={180}
            step={5}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="j-organizer-input"
          />
          <span className="text-sm text-[var(--j-muted)]">min</span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="j-organizer-save"
          >
            {saving ? "Saving…" : "Apply"}
          </button>
        </div>
        {(preview || saved || error) && (
          <p className="w-full text-sm">
            {error && <span className="text-[var(--j-live)]">{error}</span>}
            {!error && saved && (
              <span className="text-[var(--j-muted)]">Applied — judges will pick this up within a minute.</span>
            )}
            {!error && !saved && preview && (
              <span className="text-[var(--j-faint)]">Preview: {preview}</span>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
