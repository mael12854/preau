import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Outils" };

const TOOLS: { href: string; icon: IconName; title: string; staff: string; others: string; staffOnly?: boolean }[] = [
  {
    href: "/outils/quiz",
    icon: "quiz",
    title: "Quiz en direct",
    staff: "Créez un quiz, lancez-le pour une classe : les élèves répondent sur leur téléphone, les résultats peuvent devenir une évaluation.",
    others: "Rejoignez le quiz lancé par votre professeur et répondez depuis votre téléphone.",
  },
  {
    href: "/outils/vocabulaire",
    icon: "style",
    title: "Cartes de vocabulaire",
    staff: "Créez des listes de mots pour vos classes et suivez qui a révisé.",
    others: "Révisez les listes de mots de vos professeurs : chaque mot revient au bon moment.",
  },
  {
    href: "/outils/tirage",
    icon: "casino",
    title: "Tirage au sort, groupes et minuteur",
    staff: "Tirez un élève au sort, faites des équipes et affichez un minuteur géant.",
    others: "",
    staffOnly: true,
  },
];

export default async function Page() {
  const profile = await requireModule("outils");
  const tools = TOOLS.filter((t) => profile.staff || !t.staffOnly);
  return (
    <AppShell profile={profile} module="outils">
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-5 hover:border-line-strong"
            >
              <Icon name={t.icon} size={28} className="text-brand" />
              <b className="font-display text-h3">{t.title}</b>
              <span className="text-label leading-[1.45] text-ink-2">{profile.staff ? t.staff : t.others}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
