import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Schibsted_Grotesk } from "next/font/google";
import Script from "next/script";
import { ICON_FONT_URL } from "@/lib/icons";
import { THEME_SCRIPT } from "@/lib/preferences";
import { Providers } from "@/components/providers";
import { getViewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
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
  adjustFontFallback: false,
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

const TAWK_SRC = "https://embed.tawk.to/6adca10b88887d34741ee1bb/1k5mta5t9";

/** Personne connectée pour le chat d'aide (nom et e-mail), ou null. */
async function tawkVisitor(): Promise<{ name: string; email: string } | null> {
  try {
    const viewer = await getViewer();
    if (viewer?.email) return { name: viewer.name || viewer.email, email: viewer.email };
    const { data } = await (await createClient()).auth.getUser();
    const u = data.user;
    if (!u?.email) return null;
    const meta = u.user_metadata as { full_name?: string; name?: string } | undefined;
    return { name: meta?.full_name || meta?.name || u.email, email: u.email };
  } catch {
    return null;
  }
}

/** Snippet officiel tawk.to ; le visiteur est renseigné quand la personne est connectée. */
function tawkSnippet(visitor: { name: string; email: string } | null) {
  // JSON échappé pour un <script> : pas de « </script> » possible dans le nom.
  const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
  return [
    "var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();",
    visitor ? `Tawk_API.visitor=${json(visitor)};` : "",
    "(function(){var s1=document.createElement('script'),s0=document.getElementsByTagName('script')[0];",
    `s1.async=true;s1.src=${json(TAWK_SRC)};s1.charset='UTF-8';s1.setAttribute('crossorigin','*');`,
    "s0.parentNode.insertBefore(s1,s0);})();",
  ].join("");
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const visitor = await tawkVisitor();
  return (
    <html lang="fr" className={`${schibsted.variable} ${atkinson.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="stylesheet" href={ICON_FONT_URL} />
      </head>
      <body>
        <Providers>{children}</Providers>
        {/* Chat d'aide tawk.to (« J'ai un problème avec le site »), chargé une fois la page prête. */}
        <Script id="tawk-to" strategy="lazyOnload">
          {tawkSnippet(visitor)}
        </Script>
      </body>
    </html>
  );
}
