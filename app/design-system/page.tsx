import type { Metadata } from "next";
import Link from "next/link";
import { Showcase } from "@/components/design-system/showcase";
import { Logo } from "@/components/ui/logo";
import { SkipLink } from "@/components/shell/skip-link";

export const metadata: Metadata = {
  title: "Design system",
  description: "Jetons et composants de l'interface Préau.",
};

export default function DesignSystemPage() {
  return (
    <>
      <SkipLink />
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-[75rem] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3.5 sm:px-8">
          <Link href="/" className="text-ink no-underline">
            <Logo size={28} wordmarkSize={19} />
          </Link>
          <span className="text-caption text-ink-muted">Design system · v1.0</span>
          <Link href="/accueil" className="ml-auto text-label font-bold">
            Ouvrir l'application
          </Link>
        </div>
      </header>
      <main id="contenu" tabIndex={-1} className="mx-auto flex max-w-[75rem] flex-col gap-16 px-4 py-12 outline-none sm:px-8 sm:py-16">
        <div className="flex flex-col gap-3">
          <h1 className="m-0 font-display text-[clamp(2.5rem,7vw,3.5rem)] leading-none font-extrabold tracking-[-0.04em]">
            Design system
          </h1>
          <p className="m-0 max-w-[40rem] text-body text-ink-2">
            Tous les composants de Préau, construits sur les jetons du guide de marque. Chaque composant suit le
            mode sombre et les options d'affichage de Mon compte.
          </p>
        </div>
        <Showcase />
      </main>
    </>
  );
}
