import type { Metadata } from "next";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Compte non rattaché" };

/** Compte valide mais sans fiche dans un établissement. */
export default function UnlinkedAccountPage() {
  return (
    <main id="contenu" className="mx-auto flex min-h-dvh max-w-[36rem] flex-col justify-center gap-6 px-4 py-12">
      <Logo size={48} wordmarkSize={36} />
      <h1 className="m-0 font-display text-h1 font-bold">Votre compte n&apos;est pas encore rattaché</h1>
      <p className="m-0 text-body text-ink-2">
        Votre adresse est reconnue, mais aucun établissement ne l&apos;a encore associée à une fiche. Contactez le secrétariat de votre établissement.
      </p>
      <form action={signOut}>
        <Button type="submit" variant="secondary">
          Se déconnecter
        </Button>
      </form>
    </main>
  );
}
