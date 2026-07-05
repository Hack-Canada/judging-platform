import { snapToFiveMinutes } from "./format";
import type { JudgingProject, JudgingSlot, JudgingStream } from "./types";

export const MOCK_STREAMS: JudgingStream[] = [
  { id: "stream-maple", name: "Maple Hall finals", shortName: "Maple" },
  { id: "stream-cedar", name: "Cedar Room finals", shortName: "Cedar" },
  { id: "stream-pine", name: "Pine Atrium finals", shortName: "Pine" },
];

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
  streamId: string,
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
    streamId,
    startTime: snappedStart.toISOString(),
    endTime: end.toISOString(),
    room,
  };
}

const now = snapToFiveMinutes(new Date());
const hour = 60 * 60 * 1000;

export const MOCK_SLOTS: JudgingSlot[] = [
  mockSlot(
    "slot-1",
    "proj-aurora",
    "stream-maple",
    new Date(now.getTime() - 15 * 60_000),
    25,
    "Maple Hall · Table 4"
  ),
  mockSlot(
    "slot-2",
    "proj-harvest",
    "stream-cedar",
    new Date(now.getTime() + 20 * 60_000),
    15,
    "Cedar Room · Table 2"
  ),
  mockSlot(
    "slot-3",
    "proj-signal",
    "stream-maple",
    new Date(now.getTime() + 50 * 60_000),
    15,
    "Maple Hall · Table 7"
  ),
  mockSlot(
    "slot-4",
    "proj-forge",
    "stream-pine",
    new Date(now.getTime() - 2 * hour),
    15,
    "Pine Atrium · Table 1"
  ),
  mockSlot(
    "slot-5",
    "proj-tide",
    "stream-cedar",
    new Date(now.getTime() + 80 * 60_000),
    15,
    "Cedar Room · Table 9"
  ),
];

/** Generates extra synthetic projects/slots for scale testing (search + scroll). */
export function generateScaleMockSlots(
  streamId: string,
  count: number,
  baseStart: Date
): { projects: JudgingProject[]; slots: JudgingSlot[] } {
  const projects: JudgingProject[] = [];
  const slots: JudgingSlot[] = [];
  const start = snapToFiveMinutes(baseStart);

  for (let i = 0; i < count; i++) {
    const id = `scale-${streamId}-${i}`;
    projects.push({
      id,
      name: `Demo project ${i + 1}`,
      team: `Team ${Math.floor(i / 10) + 1}`,
      tracks: ["Scale demo"],
      members: ["Member A"],
      description: null,
      devpostUrl: null,
      room: i % 3 === 0 ? null : `Table ${(i % 12) + 1}`,
    });
    const slotStart = new Date(start.getTime() + i * 20 * 60_000);
    slots.push(
      mockSlot(
        `slot-${id}`,
        id,
        streamId,
        slotStart,
        15,
        `Table ${(i % 12) + 1}`
      )
    );
  }

  return { projects, slots };
}
