import type { Metadata } from "next";
import {
  Anton,
  Bangers,
  Bebas_Neue,
  Black_Ops_One,
  Cinzel,
  Creepster,
  Monoton,
  Orbitron,
  Oswald,
  Rajdhani,
  Russo_One,
  Share_Tech_Mono,
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
const oswald = Oswald({ weight: ["300", "500"], subsets: ["latin"], variable: "--font-oswald" });
const rajdhani = Rajdhani({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-rajdhani" });
const mono = Share_Tech_Mono({ weight: "400", subsets: ["latin"], variable: "--font-mono-hud" });

export const metadata: Metadata = {
  title: "Road to Doomsday",
  description: "Mission control for the MCU watch-through — every movie before Avengers: Doomsday.",
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
  rajdhani,
  mono,
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
