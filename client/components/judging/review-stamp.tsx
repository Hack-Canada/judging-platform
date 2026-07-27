"use client";

import { useEffect, useState } from "react";

type ReviewStampProps = {
  /** Bump to fire the stamp again */
  trigger: number;
};

/**
 * Rubber-ink "REVIEWED" stamp — judging's mark-complete moment.
 */
export function ReviewStamp({ trigger }: ReviewStampProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger <= 0) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    setVisible(true);
    const id = window.setTimeout(() => setVisible(false), 860);
    return () => window.clearTimeout(id);
  }, [trigger]);

  if (!visible) return null;

  return (
    <div className="j-review-stamp" aria-hidden>
      <span className="j-review-stamp-splatter j-review-stamp-splatter--a" />
      <span className="j-review-stamp-splatter j-review-stamp-splatter--b" />
      <span className="j-review-stamp-splatter j-review-stamp-splatter--c" />
      <span className="j-review-stamp-mark">Reviewed</span>
    </div>
  );
}
