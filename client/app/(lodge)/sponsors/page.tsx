import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsors - HackCanada 2027",
  description:
    "The companies backing HackCanada 2027 — flip to Judges through a bubble tide.",
  openGraph: {
    title: "Sponsors - HackCanada 2027",
    description:
      "The companies backing HackCanada 2027 — flip to Judges through a bubble tide.",
    images: [{ url: "/ocean/og-sponsors.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sponsors - HackCanada 2027",
    description:
      "The companies backing HackCanada 2027 — flip to Judges through a bubble tide.",
    images: ["/ocean/og-sponsors.webp"],
  },
};

/** UI lives in `(lodge)/layout.tsx` so GSAP state survives panel switches. */
export default function SponsorsPage() {
  return null;
}
