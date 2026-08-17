"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { formatSlotTime, resolveSlotRoom } from "@/lib/judging/format";
import type { JudgingProject, JudgingSlotWithStatus } from "@/lib/judging/types";
import { SessionRail } from "./session-rail";

type ScheduleDockProps = {
  slots: JudgingSlotWithStatus[];
  projects: JudgingProject[];
  activeProjectId: string;
  judgedIds: Set<string>;
  skippedIds: Set<string>;
  winnerIds?: Set<string>;
  judgedCount: number;
  skippedCount?: number;
  totalCount: number;
  onSelect: (projectId: string) => void;
  scheduleApproximate?: boolean;
  /** Rendered inside the drawer, above the schedule list. */
  delayControl?: React.ReactNode;
};

export function ScheduleDock({
  slots,
  projects,
  activeProjectId,
  judgedIds,
  skippedIds,
  winnerIds,
  judgedCount,
  skippedCount = 0,
  totalCount,
  onSelect,
  scheduleApproximate = false,
  delayControl,
}: ScheduleDockProps) {
  const [open, setOpen] = useState(false);
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const activeSlot = slots.find((s) => s.projectId === activeProjectId);
  const room = activeProject
    ? resolveSlotRoom(activeSlot?.room ?? null, activeProject.room)
    : null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button type="button" className="j-schedule-dock" aria-label="Open schedule">
          <span className="j-schedule-dock-progress" aria-hidden>
            {judgedCount}/{totalCount}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate font-[family-name:var(--hc-font-display)] text-sm font-semibold text-[var(--hc-ink)]">
              {activeProject?.name ?? "Schedule"}
            </span>
            <span className="block truncate text-xs text-[var(--hc-muted)]">
              {room ?? (activeSlot ? formatSlotTime(activeSlot.startTime) : "Tap for full schedule")}
            </span>
          </span>
          <ChevronUp className="size-5 shrink-0 text-[var(--hc-muted)]" aria-hidden />
        </button>
      </DrawerTrigger>
      <DrawerContent className="j-schedule-drawer border-[var(--hc-border)] bg-[var(--hc-white)] px-0 pb-[max(2rem,env(safe-area-inset-bottom))] text-[var(--hc-ink)]">
        <DrawerHeader className="shrink-0 border-b border-[var(--hc-border)] px-4 pb-4 text-left sm:px-5">
          <DrawerTitle className="font-[family-name:var(--hc-font-display)] text-2xl font-semibold tracking-[-0.02em] text-[var(--hc-ink)]">
            Your schedule
          </DrawerTitle>
          <p className="text-sm text-[var(--hc-muted)]">
            {judgedCount} judged
            {skippedCount > 0 ? ` · ${skippedCount} skipped` : ""}
            {winnerIds && winnerIds.size > 0
              ? ` · ${winnerIds.size} pick${winnerIds.size === 1 ? "" : "s"}`
              : ""}{" "}
            of {totalCount}
            {delayControl ? " · adjust pace below" : ""}
          </p>
        </DrawerHeader>
        <div className="j-schedule-drawer-body px-4 pt-2 sm:px-5">
          {delayControl ? (
            <div className="j-schedule-drawer-delay mb-3 mt-1 shrink-0">
              {delayControl}
            </div>
          ) : null}
          <SessionRail
            slots={slots}
            projects={projects}
            activeProjectId={activeProjectId}
            judgedIds={judgedIds}
            skippedIds={skippedIds}
            winnerIds={winnerIds}
            onSelect={(id) => {
              onSelect(id);
              setOpen(false);
            }}
            embedded
            scheduleApproximate={scheduleApproximate}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
