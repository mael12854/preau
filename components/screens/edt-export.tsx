"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/** Imprimer la semaine affichée, ou la télécharger en PDF (A4 paysage). */
export function EdtExport({ pdfHref }: { pdfHref: string }) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button type="button" variant="secondary" icon="print" className="h-10 px-3.5 text-label" onClick={() => window.print()}>
        Imprimer l&apos;emploi du temps
      </Button>
      <a
        href={pdfHref}
        download
        className="inline-flex h-10 items-center gap-2 rounded-control border border-line-strong bg-surface px-3.5 text-label font-bold text-ink no-underline hover:border-brand"
      >
        <Icon name="download" size={20} />
        Télécharger en PDF
      </a>
    </div>
  );
}
