import type { Metadata } from "next";
import Link from "next/link";
import { SkipLink } from "@/components/shell/skip-link";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  return (
    <>
      <SkipLink />
      <main id="contenu" tabIndex={-1} className="mx-auto flex min-h-dvh max-w-[60rem] flex-col gap-10 px-4 py-12 outline-none sm:px-8 sm:py-20">
        <Logo size={56} wordmarkSize={44} />
        <div className="flex flex-col gap-3">
          <h1 className="m-0 font-display text-[clamp(2rem,5vw,2.75rem)] leading-[1.1] font-extrabold tracking-[-0.035em]">
            Notes, devoirs, absences, messages. Tout ce qui fait la vie de l&apos;établissement, enfin lisible par chacun.
          </h1>
          <p className="m-0 text-body text-ink-2">Connectez-vous avec l&apos;adresse e-mail donnée par votre établissement.</p>
        </div>
        <LoginForm next={suite} />
        <p className="m-0 text-label">
          <Link href="/design-system">Voir le design system</Link>
        </p>
      </main>
    </>
  );
}
