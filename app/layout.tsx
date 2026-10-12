import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Schibsted_Grotesk } from "next/font/google";
import { ICON_FONT_URL } from "@/lib/icons";
import { THEME_SCRIPT } from "@/lib/preferences";
import { Providers } from "@/components/providers";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-schibsted",
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Préau", template: "%s · Préau" },
  description: "L'espace numérique du collège et du lycée : emploi du temps, devoirs, évaluations, vie scolaire.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F3EC" },
    { media: "(prefers-color-scheme: dark)", color: "#111816" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${schibsted.variable} ${atkinson.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- police d'icônes, sous-ensemble via icon_names */}
        <link rel="stylesheet" href={ICON_FONT_URL} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
