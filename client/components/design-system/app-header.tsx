import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  portalName: string;
  context?: ReactNode;
  leading?: ReactNode;
  middle?: ReactNode;
  status?: ReactNode;
  className?: string;
};

export function AppHeader({
  portalName,
  context,
  leading,
  middle,
  status,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "border-b border-[var(--hc-border)] bg-[var(--hc-paper)] text-[var(--hc-ink)]",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-screen-2xl items-center gap-2 px-4 py-2 sm:gap-3 sm:px-8 lg:px-12">
        <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
          {leading ? <div className="hidden shrink-0 sm:block">{leading}</div> : null}
          <div className="min-w-0">
            {context ? (
              <div className="text-xs font-medium text-[var(--hc-muted)] sm:text-sm">
                {context}
              </div>
            ) : null}
            <p className="font-[family-name:var(--hc-font-display)] text-base font-semibold text-[var(--hc-ink)]">
              {portalName}
            </p>
          </div>
        </div>
        {middle != null ? (
          <div className="hidden min-w-0 flex-1 px-2 sm:block sm:px-4">{middle}</div>
        ) : (
          <div className="hidden min-w-0 flex-1 sm:block" aria-hidden />
        )}
        {status ? <div className="ml-auto shrink-0">{status}</div> : null}
      </div>
    </header>
  );
}

type AppHeaderBackProps = {
  href?: string;
  label?: string;
};

export function AppHeaderBack({ href = "/", label = "← Portals" }: AppHeaderBackProps) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-[var(--hc-action)] hover:text-[var(--hc-action-hover)]"
    >
      {label}
    </Link>
  );
}
