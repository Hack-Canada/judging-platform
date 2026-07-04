import { snapToFiveMinutes } from "./format";
import type { JudgingProject, JudgingSlot } from "./types";

export const MOCK_PROJECTS: JudgingProject[] = [
  {
    id: "proj-aurora",
    name: "Aurora Transit",
    team: "Northbound Labs",
    tracks: ["Sustainability", "Mobility"],
    members: ["Maya Chen", "Jonah Park", "Elena Ruiz"],
    description:
      "Real-time bus crowding predictions using open GTFS feeds and lightweight edge inference so riders can choose less packed routes.",
    devpostUrl: "https://devpost.com",
    room: "Maple Hall · Table 4",
  },
  {
    id: "proj-harvest",
    name: "Harvest Ledger",
    team: "Field Notes",
    tracks: ["AgTech", "Open Data"],
    members: ["Amir Hassan", "Priya Nair"],
    description:
      "A shared ledger for small farms to coordinate surplus produce with local kitchens, with SMS-first intake for low-bandwidth regions.",
    devpostUrl: "https://devpost.com",
    room: "Cedar Room · Table 2",
  },
  {
    id: "proj-signal",
    name: "Signal Garden",
    team: "Quiet Circuit",
    tracks: ["Accessibility", "Health"],
    members: ["Lena Okonkwo", "Theo Martins", "Riley Shaw"],
    description:
      "Ambient soundscapes generated from biometric stress signals, giving neurodivergent users a controllable sensory environment during events.",
    devpostUrl: "https://devpost.com",
    room: "Maple Hall · Table 7",
  },
  {
    id: "proj-forge",
    name: "Forge Cartographer",
    team: "Bench Press",
    tracks: ["Developer Tools", "Education"],
    members: ["Chris Duarte", "Sofia Iqbal"],
    description:
      "Maps undocumented internal APIs by watching integration tests, then exports living diagrams for onboarding new engineers.",
    devpostUrl: "https://devpost.com",
    room: "Pine Atrium · Table 1",
  },
  {
    id: "proj-tide",
    name: "Tide Relay",
    team: "Coastal Mesh",
    tracks: ["Climate", "Hardware"],
    members: ["Noah Bell", "Ingrid Falk", "Zara Mensah"],
    description:
      "Low-cost mesh buoys that relay shoreline erosion photos to municipal dashboards when cellular networks fail during storms.",
    devpostUrl: "https://devpost.com",
    room: "Cedar Room · Table 9",
  },
];

function mockSlot(
  id: string,
  projectId: string,
  start: Date,
  durationMin: number,
  room: string
): JudgingSlot {
  const snappedStart = snapToFiveMinutes(start);
  const end = snapToFiveMinutes(
    new Date(snappedStart.getTime() + durationMin * 60_000)
  );
  return {
    id,
    projectId,
    startTime: snappedStart.toISOString(),
    endTime: end.toISOString(),
    room,
  };
}

const now = snapToFiveMinutes(new Date());
const hour = 60 * 60 * 1000;

export const MOCK_SLOTS: JudgingSlot[] = [
  mockSlot("slot-1", "proj-aurora", new Date(now.getTime() - 15 * 60_000), 25, "Maple Hall · Table 4"),
  mockSlot("slot-2", "proj-harvest", new Date(now.getTime() + 20 * 60_000), 15, "Cedar Room · Table 2"),
  mockSlot("slot-3", "proj-signal", new Date(now.getTime() + 50 * 60_000), 15, "Maple Hall · Table 7"),
  mockSlot("slot-4", "proj-forge", new Date(now.getTime() - 2 * hour), 15, "Pine Atrium · Table 1"),
];
