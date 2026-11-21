"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Bloc } from "@/lib/maths/cours/cours1";

const LABEL: Record<Bloc["kind"], string> = {
  def: "Définition",
  prop: "Propriété",
  methode: "Méthode",
  exemple: "Exemple",
  remarque: "À retenir",
};
const TONE: Record<Bloc["kind"], string> = {
  def: "border-l-info",
  prop: "border-l-brand",
  methode: "border-l-warn",
  exemple: "border-l-line-strong",
  remarque: "border-l-ok",
};

/** Une leçon : blocs Définition / Propriété / Méthode / Exemple ; impression et affichage en grand pour la projection. */
export function LessonView({ title, level, blocs }: { title: string; level: string; blocs: Bloc[]; chapterId: string }) {
  const [big, setBig] = useState(false);
  return (
    <article className={cn("flex flex-col gap-4 rounded-card border border-line bg-surface p-5 print:border-0 print:p-0", big && "fixed inset-0 z-50 overflow-auto rounded-none p-8")}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-caption text-ink-muted">Leçon · {level}</span>
          <h2 className={cn("m-0 font-display font-bold", big ? "text-hello" : "text-h2")}>{title}</h2>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="secondary" icon={big ? "close" : "visibility"} onClick={() => setBig(!big)} className="h-10 px-3 text-label">
            {big ? "Fermer" : "Projeter"}
          </Button>
          <Button variant="secondary" icon="print" onClick={() => window.print()} className="h-10 px-3 text-label">
            Imprimer
          </Button>
        </div>
      </header>
      {blocs.map((b, i) => (
        <section key={i} className={cn("flex flex-col gap-1.5 border-l-4 pl-4", TONE[b.kind])}>
          <b className={cn(big ? "text-h3" : "text-label", "text-ink-2")}>
            {LABEL[b.kind]}
            {b.title ? ` · ${b.title}` : ""}
          </b>
          <p className={cn("m-0 whitespace-pre-line", big ? "text-h2 leading-relaxed" : "text-ui leading-relaxed")}>{b.text}</p>
        </section>
      ))}
    </article>
  );
}
