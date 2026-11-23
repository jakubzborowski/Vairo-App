import type { Metadata } from "next";
import { Poppins, Inter, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@/i18n/client";
import { getDictionary, getLocale, getT } from "@/i18n/server";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-heading",
  // Poppins nie ma cyrylicy — ukraińskie nagłówki biorą litery z Intera
  // (drugi font w `--font-heading`, globals.css).
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("common");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getDictionary();

  return (
    <html
      lang={locale}
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
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
