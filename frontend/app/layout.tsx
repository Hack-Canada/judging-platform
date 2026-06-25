import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Judging Platform — Onboarding",
  description: "Onboarding project: Neon + Drizzle + Next.js + Tailwind",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full antialiased`} style={{ fontFamily: "var(--font-inter), sans-serif" }}>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3 flex items-center gap-6">
          <Link href="/" className="font-semibold text-zinc-900 dark:text-zinc-100">
            Judging Platform
          </Link>
          <Link href="/schedule" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            Schedule
          </Link>
          <Link href="/admin" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            Admin
          </Link>
        </nav>
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
