"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { BubbleBlowHost } from "./bubble-blow";
import { SwimLayer } from "./swim-layer";
import "./ocean.css";

type OceanShellProps = {
  active: "sponsors" | "judges";
  /** Fewer / quieter swim critters so a page signature can lead */
  quiet?: boolean;
  children: React.ReactNode;
};

const navLinks = [
  { href: "/sponsors", label: "Sponsors", key: "sponsors" },
  { href: "/judges", label: "Judges", key: "judges" },
] as const;

/** Mid-fi underwater shell for public Sponsors / Judges pages. */
export function OceanShell({ active, quiet = false, children }: OceanShellProps) {
  return (
    <div className={`ocean-shell ${quiet ? "ocean-shell--quiet" : ""}`}>
      <div className="ocean-caustics" aria-hidden="true" />
      <SwimLayer quiet={quiet} />
      {/* Host stays mounted so the sponsors dive can still call playBubbleBlow */}
      <BubbleBlowHost />

      <header className="ocean-header">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="ocean-display text-2xl text-[var(--ocean-ice)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ocean-ice)]"
          >
            HackCanada
          </Link>

          <nav aria-label="Event pages" className="flex items-center gap-1 sm:gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                aria-current={active === link.key ? "page" : undefined}
                className="ocean-nav-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ocean-ice)]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/"
              className="ml-1 inline-flex items-center gap-1 rounded-full border border-[color:var(--ocean-glass-border)] bg-[var(--ocean-glass)] px-2.5 py-1.5 [font-family:var(--font-figtree)] text-xs font-bold text-[var(--ocean-ice)] transition-colors hover:bg-[rgba(211,249,255,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ocean-ice)] sm:gap-1.5 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              Portals
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-[2] flex-1">{children}</main>

      <footer className="relative z-[2] border-t border-[color:var(--ocean-glass-border)] bg-[rgba(6,20,38,0.55)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-7 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="ocean-display text-xl text-[var(--ocean-ice)]">
            HackCanada 2027
          </p>
          <p className="ocean-body text-xs text-[var(--ocean-muted)]">
            Beach to deep sea · Waterloo, Ontario ·{" "}
            <a
              href="mailto:sponsors@hackcanada.org"
              className="font-bold text-[var(--ocean-foam)] hover:underline"
            >
              sponsors@hackcanada.org
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
