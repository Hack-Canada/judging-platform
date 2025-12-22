import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
