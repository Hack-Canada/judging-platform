import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Judges - HackCanada 2027",
  description:
    "Meet the HackCanada 2027 judging panel — flip to Sponsors through a bubble tide.",
  openGraph: {
    title: "Judges - HackCanada 2027",
    description:
      "Meet the HackCanada 2027 judging panel — flip to Sponsors through a bubble tide.",
    images: [{ url: "/ocean/og-judges.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Judges - HackCanada 2027",
    description:
      "Meet the HackCanada 2027 judging panel — flip to Sponsors through a bubble tide.",
    images: ["/ocean/og-judges.webp"],
  },
};

/** UI lives in `(lodge)/layout.tsx` so GSAP state survives panel switches. */
export default function JudgesPage() {
  return null;
}
