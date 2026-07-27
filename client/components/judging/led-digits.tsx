"use client";

import { cn } from "@/lib/utils";

type LedDigitsProps = {
  label: string;
  tone?: "default" | "low" | "overtime" | "waiting";
  className?: string;
};

/**
 * LED session clock digits — the desk instrument next to the draining ring.
 */
export function LedDigits({
  label,
  tone = "default",
  className,
}: LedDigitsProps) {
  return (
    <span
      className={cn("j-led", `j-led--${tone}`, className)}
      aria-hidden
    >
      {label.split("").map((char, index) => (
        <span
          key={`${index}-${char}`}
          className={cn(
            "j-led-cell",
            (char === ":" || char === "+") && "j-led-cell--sep",
          )}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
