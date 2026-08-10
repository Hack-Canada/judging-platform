"use client";

/**
 * Smooth idle float for sponsor / panel bubbles.
 * Transform-only, force3D, sine yoyo — avoids CSS keyframe jank on grids.
 */
import gsap from "gsap";

export function floatBubbles(
  roots: Iterable<Element>,
  opts?: { reduced?: boolean },
) {
  const list = Array.from(roots);
  if (!list.length) return () => undefined;

  if (opts?.reduced) {
    gsap.set(list, { clearProps: "transform" });
    return () => undefined;
  }

  const tweens: gsap.core.Tween[] = [];

  list.forEach((el, i) => {
    const orb =
      el.querySelector<HTMLElement>("[data-bubble-orb]") ??
      (el as HTMLElement);

    gsap.set(orb, { force3D: true, transformOrigin: "50% 50%" });

    // No `rotation`: a bubble is radially symmetric, so rotating it is visually
    // a no-op — but it forces the compositor to re-rasterise the layer every
    // frame instead of just re-positioning it. Pure cost, zero payoff.
    tweens.push(
      gsap.to(orb, {
        y: gsap.utils.random(-10, -5),
        x: gsap.utils.random(-4, 4),
        duration: gsap.utils.random(2.2, 3.4),
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: i * 0.08,
        force3D: true,
      }),
    );

    const shine = el.querySelector<HTMLElement>("[data-bubble-shine]");
    if (shine) {
      tweens.push(
        gsap.to(shine, {
          opacity: 1,
          scale: 1.04,
          duration: gsap.utils.random(2.8, 4.2),
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: i * 0.1,
          force3D: true,
        }),
      );
    }
  });

  return () => {
    tweens.forEach((t) => t.kill());
  };
}

/** Staggered pop-in, then hand off to floatBubbles. */
export function popBubbles(
  roots: Iterable<Element>,
  opts?: { reduced?: boolean; onComplete?: () => void },
) {
  const list = Array.from(roots);
  if (!list.length) {
    opts?.onComplete?.();
    return () => undefined;
  }

  if (opts?.reduced) {
    gsap.set(list, { opacity: 1, scale: 1, y: 0, clearProps: "transform" });
    opts.onComplete?.();
    return () => undefined;
  }

  gsap.set(list, {
    opacity: 0,
    scale: 0.5,
    y: 22,
    force3D: true,
    transformOrigin: "50% 50%",
  });

  const tween = gsap.to(list, {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.72,
    stagger: 0.065,
    ease: "back.out(1.55)",
    force3D: true,
    onComplete: opts?.onComplete,
  });

  return () => {
    tween.kill();
  };
}
