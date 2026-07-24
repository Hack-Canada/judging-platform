"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import StickerPeel from "@/components/StickerPeel";

import beaverStanding from "./assets/IMG_0104 1.png";
import beaverPoster from "./assets/IMG_0117 1.png";
import beaverHeadband from "./assets/IMG_0119 1.png";
import beaverHeart from "./assets/IMG_0122 1.png";

const stickers = [
  {
    src: beaverStanding,
    className: "bottom-[-12px] left-[4%]",
    width: 116,
    rotate: -7,
    peelDirection: 225,
  },
  {
    src: beaverPoster,
    className: "bottom-[-24px] left-[28%]",
    width: 118,
    rotate: 4,
    peelDirection: 145,
  },
  {
    src: beaverHeadband,
    className: "bottom-[-10px] left-[56%]",
    width: 118,
    rotate: 8,
    peelDirection: 35,
  },
  {
    src: beaverHeart,
    className: "bottom-[-14px] right-[3%]",
    width: 104,
    rotate: -10,
    peelDirection: 315,
  },
] as const;

function subscribeToReducedMotion(onStoreChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function StickerDock() {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    () => true,
  );

  return (
    <section
      aria-labelledby="sticker-dock-title"
      className="hacker-card-enter relative z-20 min-h-[270px] overflow-visible rounded-[1.75rem] bg-white px-5 pt-5 sm:min-h-[218px] sm:px-7"
      style={{ animationDelay: "260ms" }}
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <h2
            id="sticker-dock-title"
            className="[font-family:var(--font-fredoka)] text-xl font-semibold tracking-[-0.02em] text-[var(--brand-secondary)]"
          >
            Sticker dock
          </h2>
          <p className="mt-1 [font-family:var(--font-figtree)] text-xs text-[var(--text-secondary)] sm:text-sm">
            Drag a beaver into your workspace.
          </p>
        </div>
        <span className="hidden rounded-full bg-white/70 px-3 py-1.5 [font-family:var(--font-jetbrains-mono)] text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] sm:inline-flex">
          Hover · peel · move
        </span>
      </div>

      <div
        aria-hidden="true"
        className="relative h-[200px] overflow-visible sm:h-[150px]"
      >
        {stickers.map((sticker, index) =>
          reducedMotion ? (
            <Image
              key={sticker.src.src}
              src={sticker.src}
              alt=""
              width={sticker.width}
              className={`absolute h-auto object-contain drop-shadow-[0_12px_14px_rgba(15,42,67,0.12)] ${sticker.className}`}
            />
          ) : (
            <StickerPeel
              key={sticker.src.src}
              imageSrc={sticker.src.src}
              width={sticker.width}
              rotate={sticker.rotate}
              peelDirection={sticker.peelDirection}
              peelBackHoverPct={16}
              peelBackActivePct={28}
              shadowIntensity={0.2}
              lightingIntensity={0.08}
              dragBoundsSelector="[data-sticker-content]"
              className={`${sticker.className} ${
                index % 2 === 0 ? "z-20" : "z-10"
              }`}
            />
          ),
        )}
      </div>
    </section>
  );
}
