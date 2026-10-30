import type { Metadata } from "next";
import { Poppins, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vairo — Zbuduj swój startup od podstaw",
  description:
    "Vairo pomoże Ci znaleźć kierunek, ludzi i plan działania, by dołączyć do startupu albo zbudować własny.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${poppins.variable} ${inter.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      {/* `suppressHydrationWarning` tylko na <body>: rozszerzenia przeglądarki
          (ColorZilla — `cz-shortcut-listen`, Grammarly i inne) dopisują tu
          atrybuty, zanim React przejmie stronę, i w trybie dev wyskakiwał
          czerwony błąd hydratacji. Wyciszenie działa na jeden poziom —
          prawdziwe rozjazdy w treści strony dalej będą zgłaszane. */}
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        {children}
      </body>
    </html>
  );
}
