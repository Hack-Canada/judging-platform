import type { Metadata } from "next";
import "./globals.css";
import { figtree, fredoka, jetbrainsMono, rubik } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "HackCanada Judging Platform",
  description:
    "Hackathon judging platform for organizers, judges, hackers, volunteers, and sponsors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${rubik.variable} ${fredoka.variable} ${figtree.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className={`${fredoka.className} min-h-full flex flex-col bg-primary text-primary-foreground antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
