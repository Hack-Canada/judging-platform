/**
 * Single source of truth for the public Judges panel (underwater).
 *
 * Announces who the judges ARE — not a recruitment page.
 * Placeholders are "to be announced" layout seats, not open applications.
 */

export type Judge = {
  id: string;
  name: string;
  role?: string;
  /** Ocean depth band for accent colour. */
  depth: string;
  track: string;
  photo?: string;
  /** Creature / beaver portrait while a headshot is pending. */
  creature?: string;
  creatureAlt?: string;
  url?: string;
};

export const JUDGES: Judge[] = [];

export const DEPTH_ACCENTS: Record<string, string> = {
  Surf: "#b98a5f",
  Lagoon: "#4da3ff",
  Deep: "#00d0c0",
  Abyss: "#f2b24c",
};

export function accentForDepth(depth: string): string {
  return DEPTH_ACCENTS[depth] ?? "#8ee7ff";
}

/**
 * TBA / missing-headshot placeholders — one unique critter per seat.
 * Mix of line portraits + filled swim art so the panel never repeats a face.
 */
const SEAT_CREATURES = [
  { src: "/ocean/judge-jellyfish.png", label: "Jellyfish", lineArt: true },
  { src: "/ocean/judge-seal.png", label: "Seal", lineArt: true },
  { src: "/ocean/judge-turtle.png", label: "Turtle", lineArt: true },
  { src: "/ocean/judge-octopus.png", label: "Octopus", lineArt: true },
  { src: "/ocean/judge-starfish.png", label: "Starfish", lineArt: true },
  { src: "/ocean/judge-shark-side.png", label: "Shark", lineArt: true },
] as const;

export type SeatCreature = (typeof SEAT_CREATURES)[number];

export function creatureForSeat(index: number): SeatCreature {
  return SEAT_CREATURES[index % SEAT_CREATURES.length]!;
}

/**
 * Filled creature portraits for announced judges who still owe a headshot.
 * Line-art TBA seats always use `creatureForSeat` regardless of this flag.
 */
export const CREATURE_ART_READY = false;

export const MIN_PANEL_SEATS = 6;

export type PanelSeat =
  | { kind: "judge"; key: string; judge: Judge; depth: string }
  | { kind: "pending"; key: string; depth: string };

const DEPTH_CYCLE = ["Surf", "Lagoon", "Deep", "Abyss"];

export function panelSeats(judges: Judge[] = JUDGES): PanelSeat[] {
  const named: PanelSeat[] = judges.map((judge) => ({
    kind: "judge",
    key: judge.id,
    judge,
    depth: judge.depth,
  }));

  const pending = Math.max(0, MIN_PANEL_SEATS - judges.length);

  return [
    ...named,
    ...Array.from({ length: pending }, (_, i): PanelSeat => ({
      kind: "pending",
      key: `pending-${i}`,
      depth: DEPTH_CYCLE[(judges.length + i) % DEPTH_CYCLE.length]!,
    })),
  ];
}

export function judgeCount(): number {
  return JUDGES.length;
}

export function judgeTracks(): string[] {
  return [...new Set(JUDGES.map((j) => j.track))];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
