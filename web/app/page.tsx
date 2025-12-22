import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to HackCanada Judging Platform. Access the dashboard to manage hackathon judging, projects, and scoring.",
};

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Link href="/dashboard">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}
