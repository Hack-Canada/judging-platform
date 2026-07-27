import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--hc-radius)] border border-[var(--hc-border)] bg-[var(--hc-white)] p-6 text-[var(--hc-ink)] shadow-[var(--hc-shadow)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
