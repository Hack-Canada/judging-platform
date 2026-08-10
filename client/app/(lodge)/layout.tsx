"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LodgeBubbleBlowHost } from "@/components/lodge/bubble-blow";
import { LodgeExperience } from "@/components/lodge/lodge-experience";
import "@/components/lodge/lodge.css";

const navLinks = [
  { href: "/judges", label: "Judges", key: "judges" },
  { href: "/sponsors", label: "Sponsors", key: "sponsors" },
] as const;

/** Persists across /judges ↔ /sponsors so the GSAP bubble host stays mounted. */
export default function LodgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname?.startsWith("/sponsors") ? "sponsors" : "judges";

  return (
    <div className="lodge-shell">
      <LodgeBubbleBlowHost />

      <header className="lodge-header">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lodge-resin)]"
            aria-label="HackCanada home"
          >
            <Image
              src="/ocean/swim-beaver2.png"
              alt=""
              width={36}
              height={36}
              className="size-9 object-contain"
              aria-hidden
            />
          </Link>

          <nav aria-label="Event pages" className="flex items-center gap-1 sm:gap-1.5">
            <div className="lodge-switch lodge-switch--nav" role="tablist">
              {navLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  role="tab"
                  aria-selected={active === link.key}
                  aria-current={active === link.key ? "page" : undefined}
                  className="lodge-switch-btn"
                  onClick={(event) => {
                    if (active === link.key) {
                      event.preventDefault();
                      return;
                    }
                    event.preventDefault();
                    window.dispatchEvent(
                      new CustomEvent("lodge:switch", { detail: link.key }),
                    );
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <Link
              href="/"
              className="ml-1 inline-flex items-center gap-1 rounded-full border border-[color:var(--lodge-glass-border)] bg-[var(--lodge-glass)] px-2.5 py-1.5 [font-family:var(--font-figtree)] text-xs font-bold text-[var(--lodge-birch)] transition-colors hover:bg-[rgba(211,249,255,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lodge-resin)] sm:gap-1.5 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              Portals
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-[2] flex-1">
        <LodgeExperience />
        <div hidden>{children}</div>
      </main>

      <footer className="relative z-[2] border-t border-[color:var(--lodge-glass-border)] bg-[rgba(4,16,28,0.65)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-7 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="lodge-display text-xl text-[var(--lodge-birch)]">
            HackCanada 2027
          </p>
          <p className="lodge-body text-xs text-[var(--lodge-mist)]">
            Beach to deep sea · Waterloo, Ontario ·{" "}
            <a
              href="mailto:sponsors@hackcanada.org"
              className="font-bold text-[var(--lodge-resin)] hover:underline"
            >
              sponsors@hackcanada.org
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
