"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";

import { allSlots, accentForTier } from "@/lib/sponsors";

import { playBubbleBlow } from "./bubble-blow";
import { floatBubbles, popBubbles } from "./bubble-motion";
import { GlassBubble } from "./glass-bubble";
import { ParallaxLayer, ParallaxStage, type ParallaxStageHandle } from "./parallax-layers";
import "./dive.css";

type Stage = {
  src: string;
  label: string;
  /** Water column at this depth: [surface-side, floor-side]. */
  water: [string, string];
};

/**
 * Key art only — one frame per depth beat.
 *
 * The `water` pair is the important half. Each frame is 1536x1024 (1.50); a
 * phone hero box is ~390x780 (0.50), so `object-fit: cover` throws away about
 * two thirds of the width no matter how good the art is. The frames are
 * therefore demoted to texture plates, and the actual full-bleed fill is a
 * gradient built from these colours — a gradient cannot crop.
 */
const STAGES: Stage[] = [
  {
    src: "/ocean/dive/dive-0-surface.webp",
    label: "Surface",
    water: ["#7fd4ff", "#2b8fd0"],
  },
  {
    src: "/ocean/dive/dive-1-under.webp",
    label: "Going under",
    water: ["#4fb3e8", "#1c6ba8"],
  },
  {
    src: "/ocean/dive/dive-2-surf.webp",
    label: "Surf",
    water: ["#2f93cf", "#135584"],
  },
  {
    src: "/ocean/dive/dive-3-lagoon.webp",
    label: "Lagoon",
    water: ["#1c7ab4", "#0d4066"],
  },
  {
    src: "/ocean/dive/dive-4-deep.webp",
    label: "Deep",
    water: ["#0f4f7d", "#072a47"],
  },
  {
    src: "/ocean/dive/dive-5-abyss.webp",
    label: "Abyss",
    water: ["#072a47", "#02090f"],
  },
];

const STAGE_COUNT = STAGES.length;
/** Landing dive. Short enough that nobody waits; skip button covers the rest. */
const DIVE_MS = 2600;

function preload(src: string) {
  return new Promise<void>((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Blend two #rrggbb values. Used to walk the water column between depths. */
function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round((((pa >> 16) & 255) * (1 - t)) + (((pb >> 16) & 255) * t));
  const g = Math.round((((pa >> 8) & 255) * (1 - t)) + (((pb >> 8) & 255) * t));
  const bl = Math.round(((pa & 255) * (1 - t)) + ((pb & 255) * t));
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

/** Ease the whole dive — soft start, steady middle, soft settle. */
function diveEase(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5
    ? 4 * x * x * x
    : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** Map 0–1 progress → soft crossfade between adjacent frames. */
function scrubFromProgress(progress: number) {
  const max = STAGE_COUNT - 1;
  const clamped = Math.min(1, Math.max(0, progress));
  const pos = clamped * max;
  const from = Math.min(max - 1, Math.floor(pos));
  const to = Math.min(max, from + 1);
  const t = smoothstep(Math.min(1, Math.max(0, pos - from)));
  const stage = t < 0.5 ? from : to;
  return { from, to, t, stage, complete: clamped >= 0.992 };
}

type DiveSceneProps = {
  hero?: boolean;
  children?: ReactNode;
};

export function DiveScene({ hero = false, children }: DiveSceneProps) {
  const rosterRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barFillRef = useRef<HTMLSpanElement>(null);
  const parallaxRef = useRef<ParallaxStageHandle | null>(null);
  const blewRef = useRef(false);

  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [liveStage, setStage] = useState(0);
  const [liveComplete, setComplete] = useState(false);
  const [skipped, setSkipped] = useState(false);

  /**
   * Three different ways of saying "don't animate the descent": the user asked
   * for reduced motion, this isn't the hero, or they hit skip. All three land on
   * the same place — the last frame — so that's derived, not sequenced through
   * an effect. Deriving it means the settled render is correct on its first
   * paint instead of one render behind, and the frames below can mount already
   * showing the right plate rather than cutting to it a tick later.
   */
  const settled = ready && (reduced || !hero || skipped);
  const stage = settled ? STAGE_COUNT - 1 : liveStage;
  const complete = settled || liveComplete;

  /**
   * Which plate the frames *mount* at — deliberately not `stage`. During the
   * dive, `paintFrames` writes fractional opacities straight to the DOM every
   * frame; if this tracked `stage` too, each stage change would re-render and
   * React would stomp a mid-crossfade value back to a hard 0/1. Keyed on
   * `settled` instead, it only changes when there is no crossfade to protect.
   */
  const restFrame = settled ? STAGE_COUNT - 1 : 0;

  const onStageReady = useCallback((handle: ParallaxStageHandle) => {
    parallaxRef.current = handle;
  }, []);

  // Confirmed sponsors first, then each tier's "to be announced" bubbles, so
  // the dive lands on a populated wall of glass even before the first logo.
  const seats = useMemo(() => allSlots(), []);
  const seatCols = Math.max(2, Math.ceil(Math.sqrt(Math.max(1, seats.length))));

  const current = STAGES[stage] ?? STAGES[0];

  const paintFrames = useEffectEvent((progress: number) => {
    const { from, to, t, stage: nextStage, complete: done } =
      scrubFromProgress(progress);

    for (let i = 0; i < STAGE_COUNT; i++) {
      const el = frameRefs.current[i];
      if (!el) continue;
      let opacity = 0;
      if (i === from) opacity = 1 - t;
      if (i === to) opacity = Math.max(opacity, t);
      if (from === to) opacity = i === from ? 1 : 0;
      el.style.opacity = String(opacity);
      el.dataset.active = opacity > 0.02 ? "true" : "false";

      if (i === from) {
        el.style.transform = `translate3d(0, ${t * 4}%, 0) scale(${1 + t * 0.03})`;
      } else if (i === to) {
        el.style.transform = `translate3d(0, ${(1 - t) * -4}%, 0) scale(${1.03 - t * 0.03})`;
      } else {
        el.style.transform = "translate3d(0, 0, 0) scale(1)";
      }
    }

    // The uncroppable half of the scene. Walking the gradient through the depth
    // palette is what actually sells the descent — the plates just add texture.
    // Set on the scene root so rays/grade inherit the same reading.
    if (sceneRef.current) {
      const a = STAGES[from]?.water ?? STAGES[0].water;
      const b = STAGES[to]?.water ?? a;
      const s = sceneRef.current.style;
      s.setProperty("--water-top", mixHex(a[0], b[0], t));
      s.setProperty("--water-bottom", mixHex(a[1], b[1], t));
      // Light runs out with depth: rays fade, darkness closes in.
      s.setProperty("--depth", progress.toFixed(3));
    }

    parallaxRef.current?.setProgress(progress);

    if (barFillRef.current) {
      barFillRef.current.style.transform = `scaleX(${progress})`;
    }

    setStage((prev) => (prev === nextStage ? prev : nextStage));
    setComplete((prev) => (prev === done ? prev : done));
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduced = () => setReduced(mq.matches);
    syncReduced();
    mq.addEventListener("change", syncReduced);
    return () => mq.removeEventListener("change", syncReduced);
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Bubbles are CSS now, so there's no bubble raster left to wait on.
    Promise.all(STAGES.map((s) => preload(s.src))).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    // Already rendering the final frame (see `settled`) — this only syncs the
    // imperative half: water gradient, parallax progress, scrub bar. Scheduled
    // rather than called inline so every DOM write in this component happens at
    // the same point in the tick, whether the dive played or not.
    if (settled) {
      const raf = window.requestAnimationFrame(() => paintFrames(1));
      return () => window.cancelAnimationFrame(raf);
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const raw = Math.min(1, (now - start) / DIVE_MS);
      const progress = diveEase(raw);
      paintFrames(progress);
      if (raw < 1) {
        raf = window.requestAnimationFrame(tick);
      } else {
        paintFrames(1);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [ready, settled]);

  /* Page blow when the dive seals, then pop + float seat bubbles */
  useEffect(() => {
    if (!complete) return;

    // The roster only exists once there are sponsors to show, but the wipe is
    // the transition out of the dive and should play either way.
    const seatsEls: Element[] = rosterRef.current
      ? Array.from(rosterRef.current.querySelectorAll(".dive-seat"))
      : [];
    let killFloat: (() => void) | undefined;
    let killPop: (() => void) | undefined;
    let cancelled = false;

    const settleSeats = () => {
      if (cancelled || seatsEls.length === 0) return;
      killPop = popBubbles(seatsEls, {
        reduced,
        onComplete: () => {
          if (cancelled) return;
          killFloat = floatBubbles(seatsEls, { reduced });
        },
      });
    };

    const run = async () => {
      if (!blewRef.current && hero && !reduced) {
        blewRef.current = true;
        await playBubbleBlow({ dense: true });
        if (cancelled) return;
      } else {
        blewRef.current = true;
      }
      settleSeats();
    };

    void run();

    return () => {
      cancelled = true;
      killPop?.();
      killFloat?.();
      gsap.killTweensOf(seatsEls);
      seatsEls.forEach((el) => {
        const orb = el.querySelector("[data-bubble-orb]");
        const shine = el.querySelector("[data-bubble-shine]");
        if (orb) gsap.killTweensOf(orb);
        if (shine) gsap.killTweensOf(shine);
      });
    };
  }, [complete, hero, reduced]);

  const scene = (
    <div
      ref={sceneRef}
      className={`dive-scene ${hero ? "dive-scene--hero" : ""} ${complete ? "dive-scene--complete" : ""} ${ready ? "dive-scene--ready" : ""}`}
    >
      {children}

      <div className="dive-stage">
        {/* Full-bleed fill. A gradient can't crop, so this is the only layer
            guaranteed to reach every edge of every viewport. */}
        <div className="dive-water" aria-hidden="true" />

        <ParallaxStage
          className="dive-parallax"
          onReady={onStageReady}
          reduced={reduced}
        >
          <ParallaxLayer
            className="dive-rays"
            depth={0.2}
            travel={90}
            scrollRate={0.05}
          />

          {/* Texture plates. Cropping these is harmless — that's the point of
              demoting them from "the scene" to "surface detail". */}
          <ParallaxLayer
            className="dive-plates"
            depth={0.45}
            travel={130}
            zoom={0.06}
            scrollRate={0.1}
          >
            {STAGES.map((frame, i) => (
              <div
                key={frame.src}
                ref={(node) => {
                  frameRefs.current[i] = node;
                }}
                className="dive-frame"
                data-active={i === restFrame ? "true" : "false"}
                style={{ opacity: i === restFrame ? 1 : 0 }}
              >
                <Image
                  src={frame.src}
                  alt=""
                  fill
                  sizes="100vw"
                  preload={i <= 2}
                  unoptimized
                  draggable={false}
                  className="dive-frame-img"
                />
              </div>
            ))}
          </ParallaxLayer>

          {/* No SVG seabed layer. The dive frames already paint a reef and
              floor, so an anchored silhouette on top of them read as a hard
              black band slicing across the middle of the scene — two seabeds
              at different heights, one of them flat-shaded. The art wins. */}

          <ParallaxLayer
            className="dive-motes"
            depth={0.75}
            travel={280}
            scrollRate={0.2}
          />
        </ParallaxStage>

        <div className="dive-grade" aria-hidden="true" />

        {seats.length > 0 ? (
          <div
            ref={rosterRef}
            className={`dive-roster ${complete ? "dive-roster--live" : ""}`}
            style={{ ["--seat-cols" as string]: String(seatCols) }}
            aria-label={complete ? "Sponsors" : undefined}
            aria-hidden={complete ? undefined : true}
          >
            {seats.map((slot, i) => {
              const accent = accentForTier(slot.tier.id);
              // `--pending` is the pre-dive state of any seat; `--tba` is a
              // seat whose sponsor isn't public yet. Different axes, so a
              // bubble can legitimately be both.
              const className = [
                "dive-seat",
                complete ? "dive-seat--on" : "dive-seat--pending",
                slot.kind === "pending" ? "dive-seat--tba" : "",
              ]
                .filter(Boolean)
                .join(" ");
              const style = {
                ["--bubble-accent" as string]: accent,
                ["--bubble-i" as string]: i,
              };

              const orb = (
                <span
                  className="dive-seat-orb"
                  data-bubble-orb
                  aria-hidden="true"
                >
                  {/* ambient stays off: bubble-motion.ts owns [data-bubble-shine] */}
                  <GlassBubble accent={accent} index={i} />
                </span>
              );

              if (slot.kind === "pending") {
                return (
                  <div
                    key={slot.key}
                    className={className}
                    style={style}
                    aria-hidden="true"
                  >
                    {orb}
                    <span className="dive-seat-label dive-seat-label--tba">
                      To be announced
                    </span>
                  </div>
                );
              }

              const { sponsor } = slot;
              const label = `${sponsor.name} — ${slot.tier.name} sponsor`;

              const body = (
                <>
                  {orb}
                  {sponsor.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="dive-seat-logo" src={sponsor.logo} alt="" />
                  ) : (
                    <span className="dive-seat-label">{sponsor.name}</span>
                  )}
                </>
              );

              // A sponsor without a URL is still worth showing — it just isn't
              // a link, so it must not be focusable or announced as one.
              return sponsor.url ? (
                <a
                  key={slot.key}
                  href={sponsor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={complete ? 0 : -1}
                  aria-label={complete ? label : undefined}
                  className={className}
                  style={style}
                >
                  {body}
                </a>
              ) : (
                <div
                  key={slot.key}
                  role="img"
                  aria-label={complete ? label : undefined}
                  className={className}
                  style={style}
                >
                  {body}
                </div>
              );
            })}
          </div>
        ) : null}

        {!complete ? (
          <div className="dive-hud">
            <p className="dive-status">{current.label}</p>
            <div
              className="dive-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((stage / (STAGE_COUNT - 1)) * 100)}
              aria-label="Dive depth"
            >
              <span ref={barFillRef} />
            </div>
            {hero && !reduced ? (
              <button
                type="button"
                className="dive-skip"
                onClick={() => setSkipped(true)}
              >
                Skip the dive
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {complete ? (
        <p className="sr-only" role="status">
          Dive complete. Sponsor depths are below.
        </p>
      ) : null}
    </div>
  );

  if (!hero) return scene;

  return <div className="dive-landing">{scene}</div>;
}
