"use client";

import { useState, useTransition } from "react";
import { signDocument } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { DocumentView } from "@/lib/data/types";

type Filter = "all" | "Administratif" | "Pédagogique" | "sign";
const COLS = "@3xl:grid-cols-[minmax(0,1fr)_10rem_8.125rem_5.625rem_2.75rem]";

/** Documents : filtres, liste, badge « À signer ». */
export function DocumentsScreen({ documents: DOCUMENTS }: { documents: DocumentView[] }) {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, start] = useTransition();
  const toSign = DOCUMENTS.filter((d) => d.toSign).length;
  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "Administratif", label: "Administratif" },
    { value: "Pédagogique", label: "Pédagogique" },
    { value: "sign", label: `À signer · ${toSign}` },
  ];
  const docs = DOCUMENTS.filter((d) => filter === "all" || (filter === "sign" ? d.toSign : d.category === filter));

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Filtrer les documents" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "relative rounded-full border px-3.5 py-2 text-label after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
              filter === f.value ? "border-inverse bg-inverse font-bold text-on-inverse" : "border-line bg-surface hover:border-line-strong",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="@container overflow-hidden rounded-card border border-line bg-surface">
        <div aria-hidden="true" className={cn("hidden gap-4 border-b border-line bg-surface-2 px-5 py-3 text-meta text-ink-muted @3xl:grid", COLS)}>
          <span>Nom</span>
          <span>Catégorie</span>
          <span>Ajouté le</span>
          <span>Taille</span>
          <span />
        </div>
        <ul className="m-0 list-none p-0" aria-live="polite">
          {docs.map((d) => (
            <li key={d.id} className={cn("grid grid-cols-[minmax(0,1fr)_2.75rem] items-center gap-x-4 gap-y-1 border-b border-line-soft px-5 py-3.5 text-ui last:border-b-0", COLS)}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Icon name={d.icon} size={24} className="text-brand" />
                <b>{d.name}</b>
                {d.toSign && <Badge tone="danger" className="text-xs">À signer</Badge>}
                {d.signed && <Badge tone="ok" className="text-xs">Signé</Badge>}
                {d.toSign && (
                  <Button
                    size="sm"
                    disabled={pending}
                    aria-label={`Signer « ${d.name} »`}
                    onClick={() =>
                      start(async () => {
                        const r = await signDocument(d.id);
                        toast({ title: r.ok ? "Document signé" : r.error });
                      })
                    }
                  >
                    Signer
                  </Button>
                )}
              </div>
              <span className="row-start-2 text-ink-2 @3xl:row-start-auto">
                <span className="sr-only">Catégorie : </span>
                {d.category}
                <span className="@3xl:hidden"> · {d.date} · {d.size}</span>
              </span>
              <span className="hidden text-ink-2 @3xl:block">{d.date}</span>
              <span className="hidden text-ink-muted @3xl:block">{d.size}</span>
              <button
                type="button"
                aria-label={`Télécharger ${d.name} (${d.size})`}
                onClick={() => toast({ title: `Téléchargement de « ${d.name} »` })}
                className="col-start-2 row-span-2 row-start-1 flex size-11 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg @3xl:col-start-auto @3xl:row-span-1 @3xl:row-start-auto"
              >
                <Icon name="download" size={22} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
