import type { ReactNode } from "react";
import type { SpaceView } from "@/lib/session";
import { ActAs } from "./act-as";

/**
 * Une page de l'espace « Général » : une section par école, chacune au nom de sa fiche.
 * Hors « Général », la page de l'espace actif telle quelle.
 */
export function Sections({
  sections,
  render,
}: {
  sections: SpaceView[];
  render: (section: SpaceView, index: number) => ReactNode;
}) {
  // Une seule école : pas d'en-tête, mais toujours au nom de sa fiche (sans effet hors « Général »).
  if (sections.length === 1)
    return <ActAs profileId={sections[0].viewer.profileId}>{render(sections[0], 0)}</ActAs>;
  return (
    <div className="flex flex-col gap-10">
      {sections.map((s, i) => (
        <section key={s.viewer.profileId} aria-labelledby={`ecole-${i}`} className="flex flex-col gap-4">
          <h2 id={`ecole-${i}`} className="m-0 border-b-2 border-brand pb-2 font-display text-h2 font-extrabold">
            {s.viewer.school.name}
          </h2>
          <ActAs profileId={s.viewer.profileId}>{render(s, i)}</ActAs>
        </section>
      ))}
    </div>
  );
}
