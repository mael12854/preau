"use client";

import { useTransition } from "react";
import { payInvoice, topUpCanteen } from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { BillView } from "@/lib/data/types";
import { formatCents, formatEuro } from "@/lib/format";

const TOP_UPS = [20, 40, 60];
const SUGGESTED = 40;

type Props = {
  student: { id: string; firstName: string } | null;
  balance: { cents: number; meals: number } | null;
  menu: string[] | null;
  menuDay: string;
  bills: BillView[];
  /** Seuls les responsables paient ; le secrétariat consulte. */
  canPay: boolean;
};

/** Paiements & cantine : solde et recharge, menu du jour, factures. Paiement simulé (aucun prestataire branché). */
export function PaiementsScreen({ student, balance, menu, menuDay, bills, canPay }: Props) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const r = await fn();
      toast({ title: r.ok ? success : (r.error ?? "") });
    });

  return (
    <div className={cn("grid items-start gap-5", student && "lg:grid-cols-[22.5rem_minmax(0,1fr)]")}>
      {student && (
        <div className="flex flex-col gap-4">
          {balance && (
            <section aria-labelledby="solde" className="flex flex-col gap-4 rounded-card bg-hero p-[1.375rem] text-hero-ink">
              <div className="flex items-center justify-between">
                <h2 id="solde" className="m-0 text-label font-normal text-hero-muted">
                  Solde cantine · {student.firstName}
                </h2>
                <Icon name="restaurant" size={22} />
              </div>
              <p className="m-0 font-display text-amount font-extrabold tracking-[-0.03em]" aria-live="polite">
                {formatCents(balance.cents)}
              </p>
              <p className="m-0 text-label text-hero-soft">
                {balance.meals > 0 ? `Environ ${balance.meals} repas restants` : "Solde insuffisant pour un repas"}
              </p>
              {canPay && (
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Recharger le compte cantine">
                  {TOP_UPS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={pending}
                      aria-label={`Recharger de ${v} euros`}
                      onClick={() => act(() => topUpCanteen(student.id, v), `Compte cantine rechargé de ${formatEuro(v)}`)}
                      className={cn(
                        "h-[2.625rem] rounded-[9px] text-label font-bold disabled:opacity-60",
                        v === SUGGESTED ? "bg-bg text-brand" : "border-[1.5px] border-hero-ink/40 bg-transparent text-hero-ink hover:bg-hero-ink/10",
                      )}
                    >
                      + {v} €
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
          <section aria-labelledby="menu" className="flex flex-col gap-2.5 rounded-card border border-line bg-surface p-5">
            <h2 id="menu" className="m-0 font-display text-h3 font-bold">
              Menu de {menuDay}
            </h2>
            {menu ? (
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-ui">
                {menu.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-ui text-ink-2">Pas de service de cantine aujourd&apos;hui.</p>
            )}
          </section>
        </div>
      )}

      <section aria-labelledby="factures" className="@container overflow-hidden rounded-card border border-line bg-surface">
        <h2 id="factures" className="m-0 border-b border-line px-5 py-4 font-display text-h3 font-bold">
          Factures et paiements
        </h2>
        {bills.length === 0 && <p className="m-0 px-5 py-8 text-ui text-ink-2">Aucune facture.</p>}
        <ul className="m-0 list-none p-0">
          {bills.map((b) => (
            <li key={b.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line-soft px-5 py-4 last:border-b-0 @xl:grid-cols-[minmax(0,1fr)_7.5rem_6.875rem_7.5rem]">
              <div className="flex flex-col">
                <b className="text-ui">{b.label}</b>
                <span className="text-caption text-ink-muted">{[b.student, b.date].filter(Boolean).join(" · ")}</span>
              </div>
              <b className="tabular text-right text-md">{b.amount}</b>
              <Badge tone={b.tone}>{b.status}</Badge>
              <div className="justify-self-end @xl:justify-self-stretch">
                {b.payable && canPay && (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={pending}
                    aria-label={`Payer ${b.label}, ${b.amount}`}
                    onClick={() => act(() => payInvoice(b.id), `Paiement de ${b.amount} effectué`)}
                  >
                    Payer
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
