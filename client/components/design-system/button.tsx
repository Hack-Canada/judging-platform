import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--hc-action)] text-[var(--hc-white)] hover:bg-[var(--hc-action-hover)] border-transparent",
  secondary:
    "bg-transparent text-[var(--hc-action)] hover:text-[var(--hc-action-hover)] hover:underline border-transparent",
  outline:
    "bg-[var(--hc-white)] text-[var(--hc-ink)] border-[var(--hc-border)] hover:border-[var(--hc-ink)]",
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
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--hc-radius)] px-6",
        "font-[family-name:var(--hc-font-display)] text-base font-semibold",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hc-action)]",
        "disabled:pointer-events-none disabled:opacity-50",
        "transition-colors",
        "border",
        variantClass[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
