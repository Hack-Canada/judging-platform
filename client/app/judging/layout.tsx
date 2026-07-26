import type { Metadata } from "next";
import { JudgingShell } from "@/components/judging/judging-shell";
import "../design-tokens.css";
import "./judging.css";

export const metadata: Metadata = {
  title: "Judge desk · HackCanada",
  description:
    "In-person hackathon judging - schedule, locations, and project details for judges.",
};

export default function JudgingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <JudgingShell>{children}</JudgingShell>;
}
