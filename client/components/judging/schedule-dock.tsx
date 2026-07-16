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
  judgedCount: number;
  skippedCount?: number;
  totalCount: number;
  onSelect: (projectId: string) => void;
  scheduleApproximate?: boolean;
};

export function ScheduleDock({
  slots,
  projects,
  activeProjectId,
  judgedIds,
  skippedIds,
  judgedCount,
  skippedCount = 0,
  totalCount,
  onSelect,
  scheduleApproximate = false,
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
        <button type="button" className="j-schedule-dock lg:hidden" aria-label="Open schedule">
          <span className="j-schedule-dock-progress" aria-hidden>
            {judgedCount}/{totalCount}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold text-secondary-foreground">
              {activeProject?.name ?? "Schedule"}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {room ?? (activeSlot ? formatSlotTime(activeSlot.startTime) : "Tap for full schedule")}
            </span>
          </span>
          <ChevronUp className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </DrawerTrigger>
      <DrawerContent className="j-schedule-drawer border-[var(--j-border)] bg-[var(--j-white)] px-0 pb-8 text-[var(--j-ink)]">
        <DrawerHeader className="border-b border-border px-5 pb-4 text-left">
          <DrawerTitle className="text-lg font-semibold text-secondary-foreground">
            Your schedule
          </DrawerTitle>
          <p className="text-sm text-muted-foreground">
            {judgedCount} judged
            {skippedCount > 0 ? ` · ${skippedCount} skipped` : ""} of {totalCount} in this stream
          </p>
        </DrawerHeader>
        <div className="overflow-y-auto px-5 pt-2">
          <SessionRail
            slots={slots}
            projects={projects}
            activeProjectId={activeProjectId}
            judgedIds={judgedIds}
            skippedIds={skippedIds}
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
