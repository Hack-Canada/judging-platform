export type JudgingProject = {
  id: string;
  name: string;
  team: string;
  tracks: string[];
  members: string[];
  description: string | null;
  room: string | null;
};

export type JudgingStream = {
  id: string;
  name: string;
  /** Short label for tabs, e.g. "Maple Hall" */
  shortName?: string;
};

/** Raw slot from server — status is always derived client-side from timestamps. */
export type JudgingSlot = {
  id: string;
  projectId: string;
  streamId: string;
  startTime: string;
  endTime: string;
  room: string | null;
};

export type SlotStatus = "upcoming" | "live" | "done";

export type JudgingSlotWithStatus = JudgingSlot & { status: SlotStatus };

export type JudgeNotes = Record<string, string>;

export type SkipReason = "absent" | "not_ready" | "wrong_track";

export type JudgingStorage = {
  judgedIds: string[];
  skippedIds: string[];
  skipReasons: Record<string, SkipReason>;
  notes: JudgeNotes;
  earlyMarkedIds: string[];
  winnerIds: string[];
  ratings: Record<string, number>;
};

export type ScheduleFilter = "remaining" | "all" | "judged" | "skipped" | "picks";
