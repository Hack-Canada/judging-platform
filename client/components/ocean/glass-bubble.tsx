import type { CSSProperties, ReactNode } from "react";

/**
 * A glass bubble drawn entirely in CSS.
 *
 * Replaces `/ocean/sponsor-bubble.png`, which was a failed generation: 1920x1341
 * of near-white with one faint arc. It backed every bubble on the sponsors and
 * judges pages, so sponsor seats rendered as dull grey marbles and judge seats
 * were invisible.
 *
 * A soap bubble is a rim, a refractive tint and two speculars — which is exactly
 * what layered radial-gradients are good at. Doing it in CSS costs zero bytes,
 * stays crisp at any size, and lets each part animate independently (a PNG can
 * only ever be moved as one flat blob).
 */

type GlassBubbleProps = {
  /** Tints the refraction and rim. Defaults to the foam blue. */
  accent?: string;
  /** Staggers the ambient shimmer so a grid never pulses in unison. */
  index?: number;
  /**
   * Run the CSS shimmer keyframes.
   *
   * Off by default because CSS animations beat inline styles: any element
   * running `@keyframes glass-bubble-sheen` ignores GSAP's tween of the same
   * `opacity`/`transform`. `bubble-motion.ts` drives the sheen via the
   * `[data-bubble-shine]` hook below, so bubbles it owns must stay `ambient={false}`.
   * Set this only for decorative bubbles GSAP never touches.
   */
  ambient?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Sits inside the bubble (logo, creature, label). */
  children?: ReactNode;
};

export function GlassBubble({
  accent,
  index = 0,
  ambient = false,
  className,
  style,
  children,
}: GlassBubbleProps) {
  return (
    <span
      className={`glass-bubble${ambient ? " glass-bubble--ambient" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={
        {
          ...(accent ? { ["--bubble-accent"]: accent } : {}),
          ["--bubble-i"]: index,
          ...style,
        } as CSSProperties
      }
    >
      <span className="glass-bubble-skin" aria-hidden="true" />
      <span className="glass-bubble-sheen" data-bubble-shine aria-hidden="true" />
      {children ? <span className="glass-bubble-body">{children}</span> : null}
    </span>
  );
}
