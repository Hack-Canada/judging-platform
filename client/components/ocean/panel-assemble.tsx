"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CREATURE_ART_READY,
  JUDGES,
  accentForDepth,
  initials,
  panelSeats,
  type Judge,
} from "@/lib/judges";

import { GlassBubble } from "./glass-bubble";

type PanelAssembleProps = {
  judges?: Judge[];
};

/** The judging panel, surfacing in glass bubbles — Judges page signature. */
export function PanelAssemble({ judges = JUDGES }: PanelAssembleProps) {
  const [reduced, setReduced] = useState(false);

  const seats = useMemo(() => panelSeats(judges), [judges]);
  const count = seats.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // `MIN_PANEL_SEATS: 0` with no judges is the one way to get nothing at all.
  if (count === 0) return null;

  return (
    <div
      className={`panel-assemble ${reduced ? "panel-assemble--reduced" : ""}`}
      aria-label="Judging panel assembling"
    >
      <ul className="panel-assemble-grid">
        {seats.map((seat, i) => {
          const accent = accentForDepth(seat.depth);
          const style = { ["--i" as string]: i };

          /* ------------------------- to be announced ---------------------- */
          if (seat.kind === "pending") {
            return (
              <li
                key={seat.key}
                className="panel-assemble-slot panel-assemble-slot--pending"
                style={style}
              >
                <div className="panel-assemble-orb">
                  <GlassBubble accent={accent} index={i} ambient>
                    <span className="panel-assemble-mark" aria-hidden="true">
                      ?
                    </span>
                  </GlassBubble>
                </div>
                <p className="panel-assemble-name ocean-display">
                  To be announced
                </p>
                <p className="panel-assemble-meta">{seat.depth}</p>
              </li>
            );
          }

          /* --------------------------- named judge --------------------------- */
          const { judge } = seat;

          // A real headshot always wins. Creature art is only a stand-in for a
          // confirmed judge who hasn't sent one, and only once it's legible
          // (see CREATURE_ART_READY). Otherwise: initials.
          const portrait =
            judge.photo ?? (CREATURE_ART_READY ? judge.creature : undefined);
          const alt = judge.photo
            ? `${judge.name}, ${judge.track} judge`
            : (judge.creatureAlt ?? "");

          const body = (
            <>
              <div className="panel-assemble-orb">
                <GlassBubble accent={accent} index={i} ambient>
                  {portrait ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={portrait}
                      alt={alt}
                      className="panel-assemble-creature"
                      width={120}
                      height={120}
                    />
                  ) : (
                    <span className="panel-assemble-mark" aria-hidden="true">
                      {initials(judge.name)}
                    </span>
                  )}
                </GlassBubble>
              </div>
              <p className="panel-assemble-name ocean-display">{judge.name}</p>
              {judge.role ? (
                <p className="panel-assemble-role">{judge.role}</p>
              ) : null}
              <p className="panel-assemble-meta">
                {judge.depth} · {judge.track}
              </p>
            </>
          );

          return (
            <li key={seat.key} className="panel-assemble-slot" style={style}>
              {judge.url ? (
                <a
                  href={judge.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="panel-assemble-link"
                >
                  {body}
                </a>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
