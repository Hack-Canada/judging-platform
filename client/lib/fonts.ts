import {
  Figtree,
  Fredoka,
  JetBrains_Mono,
  Londrina_Solid,
  Rubik,
} from "next/font/google";

export const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
});

export const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

export const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

/** Mid-fi landing display face (HC-2027 feat/mid-fi-landing-page). */
export const londrina = Londrina_Solid({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-londrina",
});
