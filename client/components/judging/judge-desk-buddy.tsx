"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import beaverBuddy from "@/app/hacker/assets/IMG_0104 1.png";

const QUIPS = [
  "You've got this table.",
  "Ask about the demo.",
  "Hydrate. Then judge.",
  "One more pitch!",
  "Trust your notes.",
  "Winner vibes only.",
  "Nice desk energy.",
  "Keep the queue moving.",
] as const;

type Mood = "idle" | "wave" | "bang";

/**
 * Single desk buddy — poke for a pep talk, double-click for a gavel bang.
 * One corner presence so it stays out of the way across zoom levels.
 */
export function JudgeDeskBuddy() {
  const [mood, setMood] = useState<Mood>("idle");
  const [quip, setQuip] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const clickTimer = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!quip) return;
    const id = window.setTimeout(() => setQuip(null), 2200);
    return () => window.clearTimeout(id);
  }, [quip]);

  useEffect(() => {
    return () => {
      if (clickTimer.current) window.clearTimeout(clickTimer.current);
    };
  }, []);

  const wave = useCallback(() => {
    const next = QUIPS[Math.floor(Math.random() * QUIPS.length)]!;
    setQuip(next);
    setMood("wave");
    window.setTimeout(() => setMood("idle"), reducedMotion ? 0 : 900);
  }, [reducedMotion]);

  const bang = useCallback(() => {
    setQuip(null);
    setMood("bang");
    window.setTimeout(() => setMood("idle"), reducedMotion ? 0 : 520);
  }, [reducedMotion]);

  const onClick = useCallback(() => {
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
      bang();
      return;
    }

    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      wave();
    }, 220);
  }, [bang, wave]);

  return (
    <div className="j-desk-buddy" data-mood={mood}>
      {quip ? (
        <p className="j-desk-buddy-quip" role="status">
          {quip}
        </p>
      ) : null}
      <button
        type="button"
        className="j-desk-buddy-hit"
        onClick={onClick}
        aria-label="Poke the beaver for a pep talk. Double-click to bang the gavel."
        title="Poke · double-click to bang"
      >
        {mood === "bang" ? (
          <span className="j-desk-buddy-shock" aria-hidden />
        ) : null}
        <Image
          src={beaverBuddy}
          alt=""
          width={96}
          height={96}
          className="j-desk-buddy-img"
          draggable={false}
          priority={false}
        />
      </button>
    </div>
  );
}
