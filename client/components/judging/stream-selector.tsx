"use client";

import type { JudgingStream } from "@/lib/judging/types";
import { cn } from "@/lib/utils";

type StreamSelectorProps = {
  streams: JudgingStream[];
  activeStreamId: string;
  progressByStream: Record<
    string,
    { judged: number; skipped: number; total: number }
  >;
  onSelect: (streamId: string) => void;
};

export function StreamSelector({
  streams,
  activeStreamId,
  progressByStream,
  onSelect,
}: StreamSelectorProps) {
  if (streams.length <= 1) return null;

  return (
    <div
      className="border-b border-[var(--j-border)] bg-[var(--j-white)]"
      role="tablist"
      aria-label="Judging streams"
    >
      <div className="mx-auto flex max-w-[80rem] gap-1 overflow-x-auto px-5 py-2 sm:px-10">
        {streams.map((stream) => {
          const progress = progressByStream[stream.id];
          const isActive = stream.id === activeStreamId;
          const label = stream.shortName ?? stream.name;

          return (
            <button
              key={stream.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(stream.id)}
              className={cn(
                "j-stream-tab shrink-0",
                isActive && "j-stream-tab--active"
              )}
            >
              <span className="block font-semibold">{label}</span>
              {progress && progress.total > 0 && (
                <span className="mt-0.5 block text-xs tabular-nums opacity-80">
                  {progress.judged}
                  {progress.skipped > 0 ? `+${progress.skipped}s` : ""}/{progress.total}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
