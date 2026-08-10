"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * Layered parallax primitive for the ocean hero.
 *
 * Why this exists: a single fixed-aspect painting cannot fill a responsive
 * viewport without cropping. The dive art is 1536x1024 (1.50); a phone hero box
 * is ~390x780 (0.50). `object-fit: cover` therefore discards ~2/3 of the image
 * width, which is why the beaver and reef never reached the screen.
 *
 * The fix is compositional, not generative. Instead of stretching one scene,
 * stack independently-positioned layers: the full-bleed fill is a CSS gradient
 * (which can never crop) and every subject is an anchored sprite sized to
 * itself. Raster art is then only ever used as *texture*, where cropping is
 * harmless.
 *
 * Rule: crop the texture, position the subject.
 */

type LayerConfig = {
  /** 0 = far background (barely moves), 1 = foreground (moves most) */
  depth: number;
  /** Vertical travel in px across the full dive, scaled by depth */
  travel: number;
  /** Extra scale applied at full dive progress */
  zoom: number;
  /** How strongly this layer responds to page scroll */
  scrollRate: number;
};

type Registry = {
  register: (el: HTMLElement, cfg: LayerConfig) => () => void;
};

const ParallaxContext = createContext<Registry | null>(null);

export type ParallaxStageHandle = {
  /** Drive the dive descent, 0 -> 1. Called from an rAF loop. */
  setProgress: (p: number) => void;
};

type ParallaxStageProps = {
  className?: string;
  style?: CSSProperties;
  /** Receives the imperative handle once mounted. */
  onReady?: (handle: ParallaxStageHandle) => void;
  /** Skip all transform work (reduced motion). */
  reduced?: boolean;
  children: ReactNode;
};

/**
 * Owns the single source of motion for its layers. Transforms are written
 * directly to the DOM rather than through state, so a 60fps dive never
 * re-renders the React tree.
 */
export function ParallaxStage({
  className,
  style,
  onReady,
  reduced = false,
  children,
}: ParallaxStageProps) {
  const layersRef = useRef(new Map<HTMLElement, LayerConfig>());
  const progressRef = useRef(0);
  const scrollRef = useRef(0);
  const frameRef = useRef(0);
  // Mirrored into a ref so `paint` can stay dependency-free and keep its
  // identity stable across renders — every layer's register effect depends on
  // it, so a new `paint` would re-register the whole stack. The ref is synced
  // in the effect below rather than during render; painting is always deferred
  // to rAF, so it can never observe a stale value.
  const reducedRef = useRef(reduced);

  const paint = useCallback(() => {
    frameRef.current = 0;
    const p = progressRef.current;
    const scrolled = scrollRef.current;

    for (const [el, cfg] of layersRef.current) {
      if (reducedRef.current) {
        el.style.transform = "";
        continue;
      }
      // Descent: far layers drift slowly, near layers sweep past.
      const dive = -cfg.travel * cfg.depth * p;
      // Scroll: same depth ordering keeps the stack coherent after the dive.
      const scroll = scrolled * cfg.scrollRate * cfg.depth;
      const scale = 1 + cfg.zoom * p;
      el.style.transform = `translate3d(0, ${(dive + scroll).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    }
  }, []);

  const schedule = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(paint);
  }, [paint]);

  const register = useCallback(
    (el: HTMLElement, cfg: LayerConfig) => {
      layersRef.current.set(el, cfg);
      schedule();
      return () => {
        layersRef.current.delete(el);
      };
    },
    [schedule],
  );

  const registry = useMemo<Registry>(() => ({ register }), [register]);

  useEffect(() => {
    if (!onReady) return;
    onReady({
      setProgress: (p: number) => {
        progressRef.current = p;
        schedule();
      },
    });
  }, [onReady, schedule]);

  useEffect(() => {
    reducedRef.current = reduced;
    if (reduced) {
      paint();
      return;
    }
    const onScroll = () => {
      scrollRef.current = window.scrollY;
      schedule();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [paint, reduced, schedule]);

  useEffect(
    () => () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  return (
    <ParallaxContext.Provider value={registry}>
      <div className={className} style={style}>
        {children}
      </div>
    </ParallaxContext.Provider>
  );
}

type ParallaxLayerProps = {
  depth: number;
  travel?: number;
  zoom?: number;
  scrollRate?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * One depth plane. Never sized to cover the viewport — it either paints a
 * gradient (uncroppable) or anchors a sprite to an edge.
 */
export function ParallaxLayer({
  depth,
  travel = 120,
  zoom = 0,
  scrollRate = 0.15,
  className,
  style,
  children,
}: ParallaxLayerProps) {
  const registry = useContext(ParallaxContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !registry) return;
    return registry.register(el, { depth, travel, zoom, scrollRate });
  }, [depth, registry, scrollRate, travel, zoom]);

  return (
    <div ref={ref} className={className} style={style} aria-hidden="true">
      {children}
    </div>
  );
}
