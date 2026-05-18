import type { Metadata } from "next";
import { Inter, Crimson_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/motion/LenisProvider";
import { TopNav } from "@/components/chrome/TopNav";
import { ScrollProgress } from "@/components/chrome/ScrollProgress";
import { Footer } from "@/components/chrome/Footer";
import { CursorBlob } from "@/components/chrome/CursorBlob";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: "variable" });
const crimson = Crimson_Pro({ variable: "--font-crimson", subsets: ["latin"], weight: "variable" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: "variable" });

export const metadata: Metadata = {
  metadataBase: new URL("https://setcover.local"),
  title: "SET COVER 500×500 · Investigación de Operaciones · UNAB 2026",
  description:
    "Presentación del proyecto final de IO — 500 antenas × 500 clientes resuelto con Programación Lineal Entera y un Algoritmo Genético.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${crimson.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas-white text-dark-charcoal noise-overlay">
        <LenisProvider>
          <ScrollProgress />
          <TopNav />
          <main>{children}</main>
          <Footer />
          <CursorBlob />
        </LenisProvider>
      </body>
    </html>
  );
}
