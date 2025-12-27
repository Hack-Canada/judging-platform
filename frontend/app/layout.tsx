import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { fredoka, rubik } from "@/lib/fonts";

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
    <html lang="en">
      <body
        className={`${fredoka.className} ${rubik.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
