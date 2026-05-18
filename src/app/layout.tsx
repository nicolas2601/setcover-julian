import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/motion/LenisProvider";
import { TopNav } from "@/components/chrome/TopNav";
import { ScrollProgress } from "@/components/chrome/ScrollProgress";
import { EdgeLabels } from "@/components/chrome/EdgeLabels";
import { CursorChip } from "@/components/chrome/CursorChip";
import { Marquee } from "@/components/chrome/Marquee";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: "variable",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://setcover.local"),
  title: "SET COVER 500×500 · Investigación de Operaciones · UNAB 2026",
  description:
    "Presentación cinematográfica del proyecto final de IO — 500 antenas × 500 clientes resuelto con Programación Lineal Entera y Algoritmo Genético.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full bg-studio-black text-warm-cream noise-overlay">
        <LenisProvider>
          <ScrollProgress />
          <TopNav />
          <EdgeLabels />
          <CursorChip />
          <main>{children}</main>
          <Marquee />
        </LenisProvider>
      </body>
    </html>
  );
}
