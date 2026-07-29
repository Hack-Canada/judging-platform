"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type FlipBoardNumberProps = {
  value: string;
  className?: string;
  "aria-label"?: string;
};

/**
 * Departure-board digits: when the table number changes, each cell
 * flips like a split-flap panel. Judging's signature — not a sticker dock.
 */
export function FlipBoardNumber({
  value,
  className,
  "aria-label": ariaLabel,
}: FlipBoardNumberProps) {
  const [display, setDisplay] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const displayRef = useRef(display);
  displayRef.current = display;

  useEffect(() => {
    if (value === displayRef.current) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    setFlipping(true);
    const mid = window.setTimeout(() => setDisplay(value), 160);
    const end = window.setTimeout(() => setFlipping(false), 420);
    return () => {
      window.clearTimeout(mid);
      window.clearTimeout(end);
    };
  }, [value]);

  const chars = display.split("");

  return (
    <p
      className={cn("j-flip-board", className)}
      aria-label={ariaLabel}
      aria-live="polite"
    >
      {chars.map((char, index) => (
        <span
          key={`${index}-${char}`}
          className={cn(
            "j-flip-cell",
            flipping && "j-flip-cell--flip",
            char === " " && "j-flip-cell--space",
          )}
          style={{ animationDelay: `${index * 45}ms` }}
          aria-hidden
        >
          <span className="j-flip-cell-face">{char}</span>
        </span>
      ))}
    </p>
  );
}
