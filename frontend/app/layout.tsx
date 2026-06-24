import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { fredoka, rubik } from "@/lib/fonts";
import { PostHogProvider } from "@/components/posthog-provider";
import Navbar from "@/src/Navbar";

export const metadata: Metadata = {
  title: {
    default: "HackCanada - Judging Platform",
    template: "%s | HackCanada",
  },
  description: "Professional judging platform for hackathons. Manage projects, judges, scoring, and scheduling with ease.",
  keywords: ["hackathon", "judging", "platform", "hackcanada", "judges", "projects", "scoring"],
  authors: [{ name: "HackCanada" }],
  creator: "HackCanada",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "HackCanada Judging Platform",
    title: "HackCanada - Judging Platform",
    description: "Professional judging platform for hackathons. Manage projects, judges, scoring, and scheduling with ease.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HackCanada - Judging Platform",
    description: "Professional judging platform for hackathons. Manage projects, judges, scoring, and scheduling with ease.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${fredoka.className} ${rubik.variable} min-h-full bg-slate-50 antialiased`}
      >
        <PostHogProvider>
          <Navbar />
          <section className="min-h-[calc(100vh-4rem)]">{children}</section>
          <Toaster />
        </PostHogProvider>
      </body>
    </html>
  );
}
