"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SplitFlapTitleProps = {
  text: string;
  className?: string;
  as?: "h1" | "p" | "span";
};

/**
 * Airport departure-board title: letters cascade in when the project changes.
 */
export function SplitFlapTitle({
  text,
  className,
  as: Tag = "h1",
}: SplitFlapTitleProps) {
  const [tick, setTick] = useState(0);
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;
    setTick((n) => n + 1);
  }, [text]);

  return (
    <Tag className={cn("j-split-title", className)}>
      {text.split("").map((char, index) =>
        char === " " ? (
          <span key={`${tick}-sp-${index}`} className="j-split-title-space">
            {"\u00A0"}
          </span>
        ) : (
          <span
            key={`${tick}-${index}-${char}`}
            className="j-split-title-char"
            style={{ animationDelay: `${Math.min(index, 28) * 28}ms` }}
          >
            {char}
          </span>
        ),
      )}
    </Tag>
  );
}
