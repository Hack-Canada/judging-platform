"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

const ACCENTS = ["#8ee7ff", "#5fd8e8", "#7ef0d8", "#a9f0ff"];
const SIZES = [42, 58, 74, 50, 88, 46, 66, 80, 54, 70];

/** Soft ambient bubbles drifting behind lodge content. */
export function AmbientBubbles({ count = 7 }: { count?: number }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-orb]"));
    const tweens = nodes.map((node, i) => {
      gsap.set(node, {
        x: gsap.utils.random(0, window.innerWidth * 0.92),
        y: gsap.utils.random(100, window.innerHeight * 0.88),
        scale: gsap.utils.random(0.4, 1),
        opacity: gsap.utils.random(0.16, 0.4),
      });

      return gsap.to(node, {
        y: `-=${gsap.utils.random(90, 240)}`,
        x: `+=${gsap.utils.random(-48, 48)}`,
        duration: gsap.utils.random(9, 17),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.3,
      });
    });

    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, [count]);

  return (
    <div ref={rootRef} className="lodge-ambient" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const size = SIZES[i % SIZES.length]!;
        return (
          <span
            key={i}
            data-orb
            className="lodge-glass lodge-ambient-orb"
            style={
              {
                ["--bubble-accent"]: ACCENTS[i % ACCENTS.length],
                width: size,
                height: size,
              } as React.CSSProperties
            }
          >
            <span className="lodge-glass-skin" />
            <span className="lodge-glass-sheen lodge-glass-sheen--ambient" />
          </span>
        );
      })}
    </div>
  );
}
