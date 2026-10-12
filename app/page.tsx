import Link from "next/link";
import { chooseProfile } from "@/app/actions";
import { SkipLink } from "@/components/shell/skip-link";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { PROFILES } from "@/lib/mock/profiles";
import { SCHOOL } from "@/lib/mock/school";
import { getProfile } from "@/lib/session";

export default async function HomePage() {
  const current = await getProfile();
  return (
    <>
      <SkipLink />
      <main id="contenu" tabIndex={-1} className="mx-auto flex min-h-dvh max-w-[60rem] flex-col gap-10 px-4 py-12 outline-none sm:px-8 sm:py-20">
        <Logo size={56} wordmarkSize={44} />
        <div className="flex flex-col gap-3">
          <h1 className="m-0 font-display text-[clamp(2rem,5vw,2.75rem)] leading-[1.1] font-extrabold tracking-[-0.035em]">
            Notes, devoirs, absences, messages. Tout ce qui fait la vie de l'établissement, enfin lisible par chacun.
          </h1>
          <p className="m-0 text-body text-ink-2">
            Démonstration · {SCHOOL.name}. Choisissez un profil : chacun ne voit que ses modules.
          </p>
        </div>
        <form action={chooseProfile}>
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-4 font-display text-h2 font-bold">Se connecter en tant que</legend>
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-3 p-0">
              {PROFILES.map((p) => (
                <li key={p.id}>
                  <button
                    type="submit"
                    name="profil"
                    value={p.id}
                    aria-current={p.id === current.id ? "true" : undefined}
                    className="flex w-full items-center gap-3 rounded-card border-[1.5px] border-line bg-surface p-4 text-left hover:border-brand aria-[current]:border-brand"
                  >
                    <Avatar initials={p.initials} size={40} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <b className="text-ui">{p.label}</b>
                      <span className="truncate text-caption text-ink-muted">
                        {p.name} · {p.role}
                      </span>
                    </span>
                    <Icon name="arrow_forward" className="text-brand" />
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>
        </form>
        <p className="m-0 text-label">
          <Link href="/design-system">Voir le design system</Link>
        </p>
      </main>
    </>
  );
}
