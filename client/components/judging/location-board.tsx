"use client";

import { parseLocation } from "@/lib/judging/format";

type LocationBoardProps = {
  room: string;
  /** When judged, never show wayfinding labels */
  isJudged?: boolean;
  judgedEarly?: boolean;
};

export function LocationBoard({ room, isJudged, judgedEarly }: LocationBoardProps) {
  const { venue, tableLabel, tableNumber } = parseLocation(room);

  if (isJudged) {
    return (
      <div>
        <p className="j-location-label">Done</p>
        {tableNumber ? (
          <p className="j-location-judged-table tabular-nums">
            Table {tableNumber}
            <span className="j-hero-muted mt-1 block text-base font-normal">{venue}</span>
          </p>
        ) : (
          <p className="j-hero-muted text-lg">{venue}</p>
        )}
        {judgedEarly && <p className="j-hero-faint mt-2 text-sm">Marked early</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="j-location-label">Go here now</p>
      {tableNumber ? (
        <p className="j-location-table-num tabular-nums" aria-label={`Table ${tableNumber}`}>
          {tableNumber}
        </p>
      ) : (
        <p className="j-location-table-num j-location-table-num--venue">{venue}</p>
      )}
      {tableNumber && (
        <p className="j-hero-muted mt-2 text-lg font-medium">
          {tableLabel ?? `Table ${tableNumber}`}
        </p>
      )}
      {tableNumber && <p className="j-location-venue">{venue}</p>}
    </div>
  );
}

/** Quiet fallback when room is unknown - never a giant TBD */
export function LocationPending() {
  return <p className="j-hero-muted text-sm">Table not assigned yet</p>;
}
