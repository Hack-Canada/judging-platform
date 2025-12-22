import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Manage hackathon projects. Add, edit, delete, and search projects. Assign tracks and organize project submissions for judging.",
  keywords: ["projects", "hackathon projects", "manage projects", "project management", "submissions"],
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
