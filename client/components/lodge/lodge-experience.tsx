"use client";

import gsap from "gsap";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  accentForDepth,
  creatureForSeat,
  CREATURE_ART_READY,
  initials,
  judgeCount,
  panelSeats,
} from "@/lib/judges";
import { rosterForDisplay, sponsorCount } from "@/lib/sponsors";

import { AmbientBubbles } from "./ambient-bubbles";
import { playLodgeBubbleBlow } from "./bubble-blow";

export type LodgePanel = "judges" | "sponsors";

const steps = [
  {
    n: "01",
    title: "Demo",
    depth: "Surface",
    accent: "#4da3ff",
    copy: "Timed table demos. Judges rotate live — delays included.",
  },
  {
    n: "02",
    title: "Score",
    depth: "Midwater",
    accent: "#00d0c0",
    copy: "Criteria, notes, and queue on one desk. Scores land as you go.",
  },
  {
    n: "03",
    title: "Winners",
    depth: "Stage",
    accent: "#f2b24c",
    copy: "Finalists and sponsor picks surface, then take the main stage.",
  },
];

function panelFromPath(pathname: string | null): LodgePanel {
  return pathname?.startsWith("/sponsors") ? "sponsors" : "judges";
}

/** Combined judges + sponsors lodge — GSAP bubble wipe between panels. */
export function LodgeExperience() {
  const pathname = usePathname();
  const router = useRouter();
  const panel = panelFromPath(pathname);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const panelRef = useRef(panel);
  const stageRef = useRef<HTMLDivElement>(null);
  const prevPanel = useRef(panel);
  const judgesCount = judgeCount();
  const sponsors = sponsorCount();
  const seats = panelSeats();
  const roster = rosterForDisplay();

  panelRef.current = panel;

  useEffect(() => {
    if (prevPanel.current === panel) return;
    prevPanel.current = panel;
    const stage = stageRef.current;
    if (!stage || busyRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(stage, { autoAlpha: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      stage,
      { autoAlpha: 0.35, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
    );
  }, [panel]);

  useEffect(() => {
    const onSwitch = (event: Event) => {
      const detail = (event as CustomEvent<LodgePanel>).detail;
      if (detail === "judges" || detail === "sponsors") {
        void switchPanel(detail);
      }
    };
    window.addEventListener("lodge:switch", onSwitch);
    return () => window.removeEventListener("lodge:switch", onSwitch);
    // switchPanel reads panel/busy via refs — rebind only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function switchPanel(next: LodgePanel) {
    if (next === panelRef.current || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);

    const stage = stageRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (stage && !reduce) {
      await gsap.to(stage, {
        autoAlpha: 0,
        y: 18,
        duration: 0.25,
        ease: "power2.in",
      });
    }

    const blow = playLodgeBubbleBlow({ dense: true });
    await new Promise((r) => setTimeout(r, 380));

    prevPanel.current = next;
    router.replace(next === "judges" ? "/judges" : "/sponsors", {
      scroll: false,
    });

    await blow;

    if (stage && !reduce) {
      gsap.fromTo(
        stage,
        { autoAlpha: 0, y: -14 },
        { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
      );
    } else if (stage) {
      gsap.set(stage, { autoAlpha: 1, y: 0 });
    }

    busyRef.current = false;
    setBusy(false);
  }

  return (
    <>
      <AmbientBubbles count={7} />

      <section className="lodge-hero lodge-hero--plate" aria-labelledby="lodge-heading">
        <div className="lodge-hero-plate" aria-hidden="true">
          <Image
            src="/ocean/dive/dive-1-under.webp"
            alt=""
            fill
            priority
            className="object-cover object-[center_40%]"
            sizes="100vw"
          />
          <div className="lodge-hero-plate-veil" />
        </div>

        <div className="lodge-hero-inner">
          <p className="lodge-eyebrow">2027 · Underwater</p>
          <h1 id="lodge-heading" className="lodge-display lodge-hero-brand">
            HackCanada
          </h1>
          <p className="lodge-display lodge-hero-sub">
            {panel === "judges" ? "Judges" : "Sponsors"}
          </p>
          <p className="lodge-hero-lede">
            {panel === "judges"
              ? judgesCount > 0
                ? "The people scoring every demo at HackCanada 2027 — live from the judge desk."
                : "The people scoring every demo at HackCanada 2027. Names land here as the panel is confirmed."
              : sponsors > 0
                ? "The companies backing HackCanada 2027, grouped by depth."
                : "The companies backing HackCanada 2027. Logos land on the reef as deals go public."}
          </p>
        </div>

        <Image
          src="/ocean/swim-beaver3.png"
          alt=""
          width={380}
          height={250}
          className="lodge-hero-beaver lodge-hero-beaver--still"
          priority
          aria-hidden
        />
      </section>

      <div ref={stageRef} className="lodge-stage" data-busy={busy || undefined}>
        {panel === "judges" ? (
          <section
            id="council"
            className="council"
            aria-labelledby="council-heading"
            role="tabpanel"
          >
            <div className="council-intro">
              <h2 id="council-heading" className="lodge-display council-title">
                The panel
              </h2>
              <p className="council-lede">
                {judgesCount > 0
                  ? "Confirmed judges first. Empty bubbles are seats still to be announced."
                  : "Six bubbles hold the shape of the panel. Names land here as they're confirmed."}
              </p>
            </div>

            <ul className="council-ring">
              {seats.map((seat, index) => {
                const accent = accentForDepth(seat.depth);

                if (seat.kind === "pending") {
                  const creature = creatureForSeat(index);
                  return (
                    <li key={seat.key} className="council-seat">
                      <div
                        className="council-portrait council-portrait--bubble"
                        style={{ ["--seat-accent" as string]: accent }}
                      >
                        <span className="lodge-glass council-bubble">
                          <span className="lodge-glass-skin" />
                          <span className="lodge-glass-sheen lodge-glass-sheen--ambient" />
                          <span className="lodge-glass-body">
                            <Image
                              src={creature.src}
                              alt=""
                              width={88}
                              height={88}
                              className={`object-contain${creature.lineArt ? " council-creature--line" : ""}`}
                              aria-hidden
                            />
                          </span>
                        </span>
                      </div>
                      <p className="council-name">To be announced</p>
                      <p className="council-meta">
                        {creature.label} · {seat.depth}
                      </p>
                    </li>
                  );
                }

                const { judge } = seat;
                const portrait =
                  judge.photo ??
                  (CREATURE_ART_READY
                    ? (judge.creature ?? creatureForSeat(index).src)
                    : undefined);

                return (
                  <li key={seat.key} className="council-seat">
                    {judge.url ? (
                      <a
                        href={judge.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lodge-resin)]"
                      >
                        <JudgeBubble accent={accent} portrait={portrait} name={judge.name} />
                        <p className="council-name">{judge.name}</p>
                      </a>
                    ) : (
                      <>
                        <JudgeBubble accent={accent} portrait={portrait} name={judge.name} />
                        <p className="council-name">{judge.name}</p>
                      </>
                    )}
                    <p className="council-meta">
                      {[judge.role, judge.track].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="council-flow" aria-labelledby="flow-heading">
              <div className="council-flow-intro">
                <h3 id="flow-heading" className="lodge-display council-flow-title">
                  How it runs
                </h3>
                <p className="council-flow-lede">
                  Three beats from first demo to the stage.
                </p>
              </div>
              <ol className="council-flow-track">
                {steps.map((step) => (
                  <li
                    key={step.title}
                    className="council-step"
                    style={{ ["--step-accent" as string]: step.accent }}
                  >
                    <span className="council-step-n" aria-hidden="true">
                      {step.n}
                    </span>
                    <div className="council-step-copy">
                      <p className="council-step-depth">{step.depth}</p>
                      <h4 className="council-step-title">{step.title}</h4>
                      <p className="council-step-body">{step.copy}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : (
          <section
            id="reef"
            className="dam"
            aria-labelledby="reef-heading"
            role="tabpanel"
          >
            <div className="dam-intro">
              <h2 id="reef-heading" className="lodge-display dam-title">
                The reef
              </h2>
              <p className="dam-lede">
                {sponsors > 0
                  ? "Partners grouped by depth — Abyss at the top, Surf at the shallows."
                  : "Empty plates are seats still to be announced. Logos land here as deals go public."}
              </p>
            </div>

            <div className="dam-tiers">
              {roster.map(({ tier, slots }) => (
                <article
                  key={tier.id}
                  id={tier.id}
                  style={{ ["--tier-accent" as string]: tier.accent }}
                >
                  <header className="dam-tier-head">
                    <h3 className="dam-tier-name">{tier.name}</h3>
                    <div className="dam-tier-rule" aria-hidden="true" />
                  </header>

                  <ul className="dam-planks">
                    {slots.map((slot) => {
                      if (slot.kind === "pending") {
                        return (
                          <li key={slot.key}>
                            <div className="dam-plank dam-plank--pending dam-plank--bubble">
                              <span className="lodge-glass dam-mini-bubble">
                                <span className="lodge-glass-skin" />
                                <span className="lodge-glass-sheen lodge-glass-sheen--ambient" />
                              </span>
                              <span className="dam-plank-caption">
                                To be announced
                              </span>
                            </div>
                          </li>
                        );
                      }

                      const { sponsor } = slot;
                      const inner = sponsor.logo ? (
                        <Image
                          src={sponsor.logo}
                          alt={sponsor.name}
                          width={160}
                          height={48}
                        />
                      ) : (
                        <span className="dam-plank-name">{sponsor.name}</span>
                      );

                      return (
                        <li key={slot.key}>
                          <div className="dam-plank">
                            {sponsor.url ? (
                              <a
                                href={sponsor.url}
                                target="_blank"
                                rel="noreferrer"
                                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lodge-resin)]"
                              >
                                {inner}
                              </a>
                            ) : (
                              inner
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function JudgeBubble({
  accent,
  portrait,
  name,
}: {
  accent: string;
  portrait?: string;
  name: string;
}) {
  return (
    <div
      className="council-portrait council-portrait--bubble"
      style={{ ["--seat-accent" as string]: accent }}
    >
      <span
        className="lodge-glass council-bubble"
        style={{ ["--bubble-accent" as string]: accent }}
      >
        <span className="lodge-glass-skin" />
        <span className="lodge-glass-sheen lodge-glass-sheen--ambient" />
        <span className="lodge-glass-body">
          {portrait ? (
            <Image
              src={portrait}
              alt=""
              width={88}
              height={88}
              className="object-contain"
            />
          ) : (
            <span className="council-initials">{initials(name)}</span>
          )}
        </span>
      </span>
    </div>
  );
}
