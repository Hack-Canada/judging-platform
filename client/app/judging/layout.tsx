import type { Metadata } from "next";
import "./judging.css";

export const metadata: Metadata = {
  title: "Judge desk · HackCanada",
  description: "In-person hackathon judging — schedule, locations, and project details for judges.",
};

export default function JudgingLayout({ children }: { children: React.ReactNode }) {
  return <div className="judging-shell">{children}</div>;
}
