export type JudgingProject = {
  id: string;
  name: string;
  team: string;
  tracks: string[];
  members: string[];
  description: string | null;
  devpostUrl: string | null;
  room: string | null;
};

/** Raw slot from server — status is always derived client-side from timestamps. */
export type JudgingSlot = {
  id: string;
  projectId: string;
  startTime: string;
  endTime: string;
  room: string | null;
};

export type SlotStatus = "upcoming" | "live" | "done";

export type JudgingSlotWithStatus = JudgingSlot & { status: SlotStatus };

export type JudgeNotes = Record<string, string>;

export type JudgingStorage = {
  judgedIds: string[];
  skippedIds: string[];
  notes: JudgeNotes;
};

export type DataSource = "database" | "mock";

export type MockReason = "no_env" | "empty" | "error" | "demo";
