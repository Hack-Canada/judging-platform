"use client";

import type { JudgingStream } from "@/lib/judging/types";

type StreamSelectorProps = {
  streams: JudgingStream[];
  activeStreamId: string;
  progressByStream: Record<
    string,
    { judged: number; skipped: number; total: number }
  >;
  onSelect: (streamId: string) => void;
  /** Inline compact select for the header (default). */
  variant?: "select" | "hidden";
};

/**
 * Stream picker. Horizontal tab strip removed to save vertical space;
 * use the compact select next to the header breadcrumb.
 */
export function StreamSelector({
  streams,
  activeStreamId,
  progressByStream,
  onSelect,
  variant = "select",
}: StreamSelectorProps) {
  if (variant === "hidden" || streams.length <= 1) return null;

  return (
    <label className="j-stream-select inline-flex max-w-full items-center gap-1.5">
      <span className="sr-only">Judging stream</span>
      <select
        className="j-stream-select-control"
        value={activeStreamId}
        onChange={(e) => onSelect(e.target.value)}
        aria-label="Judging stream"
      >
        {streams.map((stream) => {
          const progress = progressByStream[stream.id];
          const label = stream.shortName ?? stream.name;
          const count =
            progress && progress.total > 0
              ? ` (${progress.judged}/${progress.total}${
                  progress.skipped > 0 ? `, ${progress.skipped} skip` : ""
                })`
              : "";
          return (
            <option key={stream.id} value={stream.id}>
              {label}
              {count}
            </option>
          );
        })}
      </select>
    </label>
  );
}
