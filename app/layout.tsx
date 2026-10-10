import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel" });
const terminal = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt" });

export const metadata: Metadata = {
  title: "Road to Doomsday",
  description: "James & Deniz's MCU watch-through tracker — every movie before Avengers: Doomsday.",
};

export const viewport: Viewport = {
  themeColor: "#07051a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixel.variable} ${terminal.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
