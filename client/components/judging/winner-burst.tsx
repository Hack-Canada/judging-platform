"use client";

import { useEffect, useState } from "react";

type WinnerBurstProps = {
  /** Bump when a project is added to winner picks */
  trigger: number;
};

/**
 * Gold flash when a judge locks a winner pick — trophy desk energy.
 */
export function WinnerBurst({ trigger }: WinnerBurstProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger <= 0) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    setVisible(true);
    const id = window.setTimeout(() => setVisible(false), 780);
    return () => window.clearTimeout(id);
  }, [trigger]);

  if (!visible) return null;

  return (
    <div className="j-winner-burst" aria-hidden>
      <span className="j-winner-burst-ring" />
      <span className="j-winner-burst-mark">Pick</span>
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="j-winner-burst-spark"
          style={{
            ["--spark-angle" as string]: `${i * 45}deg`,
            animationDelay: `${i * 28}ms`,
          }}
        />
      ))}
    </div>
  );
}
