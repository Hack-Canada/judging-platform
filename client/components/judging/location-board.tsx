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
        <p className="j-location-label">Judged</p>
        {tableNumber ? (
          <>
            <p className="j-location-table-num tabular-nums">{tableNumber}</p>
            <p className="j-location-venue">{venue}</p>
          </>
        ) : (
          <p className="mt-2 text-lg text-[rgb(245_243_239/0.55)]">{venue}</p>
        )}
        {judgedEarly && (
          <p className="mt-3 text-sm text-[rgb(245_243_239/0.45)]">Marked before slot time</p>
        )}
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
        <p className="mt-2 text-lg font-medium text-[rgb(245_243_239/0.75)]">
          {tableLabel ?? `Table ${tableNumber}`}
        </p>
      )}
      {tableNumber && <p className="j-location-venue">{venue}</p>}
    </div>
  );
}

/** Quiet fallback when room is unknown — never a giant TBD */
export function LocationPending() {
  return (
    <p className="text-sm text-[rgb(245_243_239/0.45)]">
      Table not assigned yet — check with an organizer
    </p>
  );
}
