import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/*
 * The hacker portal's panel: generous corner radius, a soft hairline border
 * carrying the weight instead of a drop shadow, white on blue-tinted paper.
 */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--hc-radius-card)] border border-[color-mix(in_srgb,var(--hc-border)_65%,transparent)]",
        "bg-[var(--hc-white)] p-6 text-[var(--hc-ink)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
