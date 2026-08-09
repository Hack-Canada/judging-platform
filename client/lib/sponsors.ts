/**
 * Public Sponsors page — underwater depth wall.
 *
 * Announces who the sponsors ARE — no pitch, no pricing, no lead capture.
 * Placeholders say "to be announced" as a layout floor.
 */

export type SponsorTier = {
  id: string;
  name: string;
  /** Shallow → deep. Drives wall order. */
  unlockDepth: number;
  accent: string;
  minPlates: number;
};

export type Sponsor = {
  id: string;
  name: string;
  tierId: string;
  logo?: string;
  url?: string;
};

export type SponsorSlot =
  | { kind: "sponsor"; key: string; tier: SponsorTier; sponsor: Sponsor }
  | { kind: "pending"; key: string; tier: SponsorTier };

export type TierRoster = {
  tier: SponsorTier;
  slots: SponsorSlot[];
  sponsorCount: number;
  pendingCount: number;
};

/** Shallow → deep. Depths are a grouping, not an inventory. */
export const SPONSOR_TIERS: SponsorTier[] = [
  { id: "tier-surf", name: "Surf", unlockDepth: 1, accent: "#b98a5f", minPlates: 4 },
  { id: "tier-lagoon", name: "Lagoon", unlockDepth: 2, accent: "#4da3ff", minPlates: 3 },
  { id: "tier-deep", name: "Deep", unlockDepth: 3, accent: "#00d0c0", minPlates: 3 },
  { id: "tier-abyss", name: "Abyss", unlockDepth: 4, accent: "#f2b24c", minPlates: 2 },
];

export const SPONSORS: Sponsor[] = [];

function tiersByDepth(): SponsorTier[] {
  return [...SPONSOR_TIERS].sort((a, b) => a.unlockDepth - b.unlockDepth);
}

export function buildRoster(): TierRoster[] {
  return tiersByDepth()
    .map((tier) => {
      const sponsors = SPONSORS.filter((s) => s.tierId === tier.id);
      const pendingCount = Math.max(0, tier.minPlates - sponsors.length);

      const slots: SponsorSlot[] = [
        ...sponsors.map(
          (sponsor): SponsorSlot => ({
            kind: "sponsor",
            key: sponsor.id,
            tier,
            sponsor,
          }),
        ),
        ...Array.from(
          { length: pendingCount },
          (_, i): SponsorSlot => ({
            kind: "pending",
            key: `${tier.id}-pending-${i}`,
            tier,
          }),
        ),
      ];

      return { tier, slots, sponsorCount: sponsors.length, pendingCount };
    })
    .filter((row) => row.slots.length > 0);
}

/** Deepest-first for the wall — headline partners lead. */
export function rosterForDisplay(): TierRoster[] {
  return [...buildRoster()].reverse();
}

export function allSlots(): SponsorSlot[] {
  return buildRoster().flatMap((row) => row.slots);
}

export function sponsorCount(): number {
  return SPONSORS.length;
}

export function accentForTier(tierId: string): string {
  return SPONSOR_TIERS.find((t) => t.id === tierId)?.accent ?? "#8ee7ff";
}
