import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

/*
 * Matches the hacker portal's CTA language: pill shape, Figtree semibold,
 * a small lift on hover and a press-in on active.
 */
const variantClass: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--hc-action)] text-[var(--hc-white)] shadow-[var(--hc-shadow-press)] hover:-translate-y-0.5 hover:bg-[var(--hc-action-hover)] hover:shadow-[0_14px_26px_rgb(15_42_67/0.22)]",
  secondary:
    "border-transparent bg-transparent text-[var(--hc-action)] hover:bg-[var(--hc-accent-soft)] hover:text-[var(--hc-action-hover)]",
  outline:
    "border-[color-mix(in_srgb,var(--hc-border)_75%,transparent)] bg-[var(--hc-white)] text-[var(--hc-ink)] shadow-[0_4px_12px_rgb(15_42_67/0.06)] hover:-translate-y-0.5 hover:border-[var(--hc-accent)] hover:shadow-[var(--hc-shadow-soft)]",
};

export function Button({
  variant = "primary",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--hc-radius-pill)] px-6",
        "font-[family-name:var(--hc-font-body)] text-base font-semibold",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hc-accent)]",
        "disabled:pointer-events-none disabled:opacity-50",
        "border transition-[transform,box-shadow,background-color,border-color] duration-200",
        "active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none",
        variantClass[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
