"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

import "./bubble-blow.css";

const COUNT = 14;
const ACCENTS = ["#8ee7ff", "#5fd8e8", "#a9f0ff", "#6fb7ff", "#7ef0d8"];

function makeOrb(index: number): HTMLDivElement {
  const orb = document.createElement("div");
  orb.className = "lodge-blow-orb";
  orb.style.setProperty("--bubble-accent", ACCENTS[index % ACCENTS.length]!);
  return orb;
}

type PlayOpts = { dense?: boolean };
type Player = (opts?: PlayOpts) => Promise<void>;

let player: Player | null = null;
let queue: Promise<void> = Promise.resolve();

/** Full-page bubble wipe between panels — lives in `LodgeBubbleBlowHost`. */
export function playLodgeBubbleBlow(opts?: PlayOpts): Promise<void> {
  queue = queue.then(() => (player ? player(opts) : Promise.resolve()));
  return queue;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LodgeBubbleBlowHost() {
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
          const size = gsap.utils.random(cover * 0.5, cover * 1.05);
          orb.style.width = `${size}px`;
          orb.style.height = `${size}px`;
          field.appendChild(orb);
          nodes.push(orb);
        }

        gsap.set(root, { autoAlpha: 1, pointerEvents: "none" });
        gsap.set(veil, { opacity: 0 });
        gsap.set(nodes, {
          x: () => gsap.utils.random(-cover * 0.35, vw - cover * 0.2),
          y: () => vh + gsap.utils.random(cover * 0.08, cover * 0.4),
          scale: () => gsap.utils.random(0.35, 0.65),
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

        tl.to(veil, { opacity: 0.9, duration: 0.3, ease: "power2.out" }, 0);

        tl.to(
          nodes,
          {
            opacity: () => gsap.utils.random(0.85, 1),
            scale: () => gsap.utils.random(1.05, 1.45),
            duration: 0.55,
            stagger: { each: 0.03, from: "random" },
            ease: "power2.out",
          },
          0.02,
        );

        tl.to(
          nodes,
          {
            y: () => gsap.utils.random(-cover * 0.55, -cover * 0.1),
            x: () => `+=${gsap.utils.random(-cover * 0.14, cover * 0.14)}`,
            rotation: () => gsap.utils.random(-28, 28),
            duration: () => gsap.utils.random(1.2, 1.8),
            stagger: { each: 0.028, from: "random" },
            ease: "power1.inOut",
          },
          0.06,
        );

        tl.to(veil, { opacity: 0, duration: 0.65, ease: "power2.inOut" }, 1.0);

        tl.to(
          nodes,
          {
            opacity: 0,
            scale: () => gsap.utils.random(1.2, 1.7),
            y: "-=180",
            duration: 0.6,
            stagger: { each: 0.025, from: "edges" },
            ease: "power2.in",
          },
          1.05,
        );
      });

    player = run;
    return () => {
      if (player === run) player = null;
      gsap.killTweensOf([root, veil, field]);
    };
  }, []);

  return (
    <div ref={rootRef} className="lodge-blow" aria-hidden="true">
      <div ref={veilRef} className="lodge-blow-veil" />
      <div ref={fieldRef} className="lodge-blow-field" />
    </div>
  );
}
