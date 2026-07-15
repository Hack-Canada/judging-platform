import { Figtree, Fredoka, JetBrains_Mono, Rubik } from "next/font/google";

export const fredoka = Fredoka({ subsets: ["latin"] });

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
