"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

import "./bubble-blow.css";

/** Fewer orbs — each one is near full-viewport so they blot the page. */
const COUNT = 14;

/** Rim/refraction tints, sampled per orb so the wipe reads as water not fog. */
const ACCENTS = ["#8ee7ff", "#5fd8e8", "#a9f0ff", "#6fb7ff", "#7ef0d8"];

/**
 * One CSS glass bubble, built imperatively to match `<GlassBubble>`.
 *
 * This used to be `<img src="/ocean/sponsor-bubble.png">`. That file is a failed
 * generation — 1920x1341 of near-white with one faint arc — so the timeline below
 * was blowing 18 copies of a white rectangle across the viewport at up to 105% of
 * the screen. The elaborate motion was real; the artwork was fog.
 */
function makeOrb(index: number): HTMLDivElement {
  const orb = document.createElement("div");
  orb.className = "bubble-blow-orb glass-bubble";
  orb.style.setProperty("--bubble-accent", ACCENTS[index % ACCENTS.length]);

  const skin = document.createElement("span");
  skin.className = "glass-bubble-skin";
  const sheen = document.createElement("span");
  sheen.className = "glass-bubble-sheen";
  orb.append(skin, sheen);

  return orb;
}

type PlayOpts = {
  /** Extra density for a heavier wipe */
  dense?: boolean;
};

type Player = (opts?: PlayOpts) => Promise<void>;

let player: Player | null = null;
let queue: Promise<void> = Promise.resolve();

/** Run the full-page bubble blow (waits if one is already playing). */
export function playBubbleBlow(opts?: PlayOpts): Promise<void> {
  queue = queue.then(() => (player ? player(opts) : Promise.resolve()));
  return queue;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Fixed overlay host — mount once inside OceanShell.
 * Bubbles are GPU-transformed only (x/y/scale/rotate/opacity).
 */
export function BubbleBlowHost() {
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const field = fieldRef.current;
    const veil = veilRef.current;
    if (!root || !field || !veil) return;

    gsap.set(root, { autoAlpha: 0, pointerEvents: "none" });

    const run: Player = (opts) =>
      new Promise((resolve) => {
        if (prefersReducedMotion()) {
          resolve();
          return;
        }

        const count = opts?.dense ? 18 : COUNT;
        field.replaceChildren();

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cover = Math.max(vw, vh);

        const nodes: HTMLDivElement[] = [];
        for (let i = 0; i < count; i++) {
          const orb = makeOrb(i);
          // Near full-screen orbs — a handful eats the whole page
          const size = gsap.utils.random(cover * 0.55, cover * 1.05);
          orb.style.width = `${size}px`;
          orb.style.height = `${size}px`;
          field.appendChild(orb);
          nodes.push(orb);
        }

        gsap.set(root, { autoAlpha: 1, pointerEvents: "auto" });
        gsap.set(veil, { opacity: 0 });
        gsap.set(nodes, {
          x: () => gsap.utils.random(-cover * 0.35, vw - cover * 0.2),
          y: () => vh + gsap.utils.random(cover * 0.1, cover * 0.45),
          scale: () => gsap.utils.random(0.45, 0.75),
          rotation: () => gsap.utils.random(-18, 18),
          opacity: 0,
          force3D: true,
          transformOrigin: "50% 50%",
        });

        const tl = gsap.timeline({
          defaults: { force3D: true },
          onComplete: () => {
            field.replaceChildren();
            gsap.set(root, { autoAlpha: 0, pointerEvents: "none" });
            resolve();
          },
        });

        tl.to(
          veil,
          { opacity: 0.82, duration: 0.4, ease: "power2.out" },
          0,
        );

        tl.to(
          nodes,
          {
            opacity: () => gsap.utils.random(0.75, 1),
            scale: () => gsap.utils.random(1.05, 1.45),
            duration: 0.65,
            stagger: { each: 0.04, from: "random" },
            ease: "power2.out",
          },
          0.04,
        );

        tl.to(
          nodes,
          {
            y: () => gsap.utils.random(-cover * 0.55, -cover * 0.15),
            x: () => `+=${gsap.utils.random(-cover * 0.12, cover * 0.12)}`,
            rotation: () => gsap.utils.random(-28, 28),
            duration: () => gsap.utils.random(1.4, 2.0),
            stagger: { each: 0.035, from: "random" },
            ease: "power1.inOut",
          },
          0.1,
        );

        tl.to(
          nodes,
          {
            x: () => `+=${gsap.utils.random(-cover * 0.18, cover * 0.18)}`,
            scale: "*=1.12",
            duration: 0.55,
            stagger: { each: 0.025, from: "center" },
            ease: "sine.inOut",
          },
          0.5,
        );

        tl.to(
          veil,
          { opacity: 0, duration: 0.75, ease: "power2.inOut" },
          1.15,
        );

        tl.to(
          nodes,
          {
            opacity: 0,
            scale: () => gsap.utils.random(1.2, 1.7),
            y: "-=180",
            duration: 0.7,
            stagger: { each: 0.03, from: "edges" },
            ease: "power2.in",
          },
          1.2,
        );
      });

    player = run;
    return () => {
      if (player === run) player = null;
      gsap.killTweensOf([root, veil, field]);
    };
  }, []);

  return (
    <div ref={rootRef} className="bubble-blow" aria-hidden="true">
      <div ref={veilRef} className="bubble-blow-veil" />
      <div ref={fieldRef} className="bubble-blow-field" />
    </div>
  );
}
