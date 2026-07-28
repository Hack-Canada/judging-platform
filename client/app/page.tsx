import {
  ArrowUpRight,
  ClipboardCheck,
  Code2,
  HandHelping,
  Landmark,
  Shield,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import ClickSpark from "@/components/ClickSpark";

import beaverPortrait from "./hacker/assets/IMG_0121 1.png";

type Portal = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  featured?: boolean;
};

const portals: Portal[] = [
  {
    label: "Hacker",
    description: "Schedule, submit, and stickers.",
    href: "/hacker",
    icon: Code2,
    featured: true,
  },
  {
    label: "Judging",
    description: "Score projects live.",
    href: "/judging",
    icon: ClipboardCheck,
  },
  {
    label: "Volunteer",
    description: "Shifts and check-in.",
    href: "/volunteer",
    icon: HandHelping,
  },
  {
    label: "Sponsor",
    description: "Booths and mentoring.",
    href: "/sponsor",
    icon: Landmark,
  },
  {
    label: "Admin",
    description: "Ops and schedule.",
    href: "/admin",
    icon: Shield,
  },
];

export default function Home() {
  return (
    <ClickSpark
      sparkColor="#4da3ff"
      sparkSize={9}
      sparkRadius={22}
      sparkCount={8}
      duration={420}
      extraScale={1.1}
    >
      <main className="relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-[var(--bg-light)] text-[var(--text-body)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-28 size-72 rounded-full border-[28px] border-[color:var(--bg-primary-light)]/80"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-16 size-56 rounded-full bg-[var(--brand-accent)]/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[18%] top-[14%] size-3 rotate-12 rounded-[3px] bg-[var(--brand-accent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[22%] left-[12%] size-2.5 rounded-full bg-[var(--bg-warning)]"
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-1 flex-col justify-center px-4 py-10 sm:px-6 sm:py-14">
          <section
            className="hacker-card-enter relative isolate overflow-hidden rounded-[1.75rem] border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] shadow-[0_18px_42px_rgba(77,163,255,0.1)]"
            style={{ animationDelay: "40ms" }}
          >
            <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
              <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-9 lg:px-11 lg:py-12">
                <h1 className="max-w-[520px] [font-family:var(--font-fredoka)] text-[clamp(2.4rem,5.5vw,4.2rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-[var(--brand-secondary)]">
                  Hack
                  <span className="text-[var(--text-primary)]">Canada</span>
                </h1>
                <p className="mt-4 max-w-md [font-family:var(--font-figtree)] text-sm leading-6 text-[var(--text-secondary)] sm:text-[15px]">
                  Pick your portal and jump into the weekend.
                </p>

                <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
                  {portals.map(
                    ({ label, description, href, icon: Icon, featured }, i) => (
                      <Link
                        key={href}
                        href={href}
                        className={`portal-pop group flex min-h-[72px] items-center gap-3 rounded-2xl px-4 py-3 transition-[transform,box-shadow,background-color,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] ${
                          featured
                            ? "bg-[var(--brand-secondary)] text-white shadow-[0_10px_22px_rgba(15,42,67,0.18)] hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(15,42,67,0.22)] sm:col-span-2"
                            : "border border-[color:var(--bg-gray-dark)]/70 bg-[var(--bg-light)] text-[var(--brand-secondary)] hover:-translate-y-1 hover:bg-white hover:shadow-[0_12px_24px_rgba(15,42,67,0.1)]"
                        }`}
                        style={{ animationDelay: `${120 + i * 45}ms` }}
                      >
                        <span
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            featured
                              ? "bg-white/15 text-white"
                              : "bg-[var(--bg-primary-light)] text-[var(--text-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-white"
                          }`}
                        >
                          <Icon className="size-[18px]" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block [font-family:var(--font-figtree)] text-sm font-bold sm:text-[15px]">
                            {label}
                          </span>
                          <span
                            className={`mt-0.5 block [font-family:var(--font-figtree)] text-xs leading-5 sm:text-[13px] ${
                              featured
                                ? "text-white/75"
                                : "text-[var(--text-secondary)]"
                            }`}
                          >
                            {description}
                          </span>
                        </span>
                        <ArrowUpRight
                          className={`size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
                            featured
                              ? "text-white/70"
                              : "text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]"
                          }`}
                          aria-hidden="true"
                        />
                      </Link>
                    ),
                  )}
                </div>
              </div>

              <div
                className="relative min-h-[260px] overflow-hidden lg:min-h-full"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 50% 52%, rgba(220,235,251,0.85), rgba(255,255,255,0) 58%)",
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute left-[14%] top-[16%] h-14 w-24 -rotate-6 rounded-full bg-white/70"
                />
                <div
                  aria-hidden="true"
                  className="absolute right-[12%] top-[12%] size-8 rounded-full bg-[var(--bg-warning)]"
                />
                <div className="relative flex h-full min-h-[260px] items-end justify-center px-6 pt-6 lg:min-h-[420px]">
                  <Image
                    src={beaverPortrait}
                    alt="HackCanada beaver mascot"
                    priority
                    className="beaver-float relative z-10 h-auto max-h-[300px] w-auto max-w-[86%] object-contain drop-shadow-[0_22px_24px_rgba(15,42,67,0.16)] lg:max-h-[340px]"
                    sizes="(max-width: 1024px) 55vw, 360px"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </ClickSpark>
  );
}
