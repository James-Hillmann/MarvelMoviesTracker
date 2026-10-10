import type { Metadata } from "next";
import {
  Anton,
  Bangers,
  Bebas_Neue,
  Black_Ops_One,
  Cinzel,
  Comic_Neue,
  Creepster,
  Monoton,
  Orbitron,
  Oswald,
  Russo_One,
} from "next/font/google";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const bangers = Bangers({ weight: "400", subsets: ["latin"], variable: "--font-bangers" });
const russo = Russo_One({ weight: "400", subsets: ["latin"], variable: "--font-russo" });
const blackops = Black_Ops_One({ weight: "400", subsets: ["latin"], variable: "--font-blackops" });
const cinzel = Cinzel({ weight: "700", subsets: ["latin"], variable: "--font-cinzel" });
const creepster = Creepster({ weight: "400", subsets: ["latin"], variable: "--font-creepster" });
const orbitron = Orbitron({ weight: "700", subsets: ["latin"], variable: "--font-orbitron" });
const monoton = Monoton({ weight: "400", subsets: ["latin"], variable: "--font-monoton" });
const comic = Comic_Neue({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-comic" });
const oswald = Oswald({ weight: ["300", "500"], subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
  title: "Road to Doomsday",
  description: "James & Deniz's MCU watch-through tracker — every movie before Avengers: Doomsday.",
};

const fontVars = [
  anton,
  bebas,
  bangers,
  russo,
  blackops,
  cinzel,
  creepster,
  orbitron,
  monoton,
  oswald,
  comic,
]
  .map((f) => f.variable)
  .join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVars} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
