import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scoring System",
  description: "Configure scoring criteria and investment ranges for HackCanada judging. Set up evaluation metrics and scoring parameters.",
  keywords: ["scoring", "criteria", "evaluation", "investment", "judging criteria", "scoring system"],
};

export default function ScoringSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
