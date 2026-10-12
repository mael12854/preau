"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatEuro } from "@/lib/format";
import { BILLS, CANTEEN } from "@/lib/mock";

/** Paiements & cantine : solde et recharge, menu du jour, factures. */
export function PaiementsScreen() {
  const toast = useToast();
  const [balance, setBalance] = useState(CANTEEN.balance);
  const [paid, setPaid] = useState<string[]>([]);
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[22.5rem_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <section aria-labelledby="solde" className="flex flex-col gap-4 rounded-card bg-hero p-[1.375rem] text-hero-ink">
          <div className="flex items-center justify-between">
            <h2 id="solde" className="m-0 text-label font-normal text-hero-muted">
              Solde cantine · {CANTEEN.child}
            </h2>
            <Icon name="restaurant" size={22} />
          </div>
          <p className="m-0 font-display text-amount font-extrabold tracking-[-0.03em]" aria-live="polite">
            {formatEuro(balance)}
          </p>
          <p className="m-0 text-label text-hero-soft">{CANTEEN.mealsLeft}</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Recharger le compte cantine">
            {CANTEEN.topUps.map((v) => (
              <button
                key={v}
                type="button"
                aria-label={`Recharger de ${v} euros`}
                onClick={() => {
                  setBalance((b) => b + v);
                  toast({ title: `Compte cantine rechargé de ${formatEuro(v)}` });
                }}
                className={cn(
                  "h-[2.625rem] rounded-[9px] text-label font-bold",
                  v === CANTEEN.suggested ? "bg-bg text-brand" : "border-[1.5px] border-hero-ink/40 bg-transparent text-hero-ink hover:bg-hero-ink/10",
                )}
              >
                + {v} €
              </button>
            ))}
          </div>
        </section>
        <section aria-labelledby="menu" className="flex flex-col gap-2.5 rounded-card border border-line bg-surface p-5">
          <h2 id="menu" className="m-0 font-display text-h3 font-bold">
            Menu de {CANTEEN.menuDay}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-ui">
            {CANTEEN.menu.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="factures" className="@container overflow-hidden rounded-card border border-line bg-surface">
        <h2 id="factures" className="m-0 border-b border-line px-5 py-4 font-display text-h3 font-bold">
          Factures et paiements
        </h2>
        <ul className="m-0 list-none p-0">
          {BILLS.map((b) => {
            const isPaid = paid.includes(b.label);
            return (
              <li key={b.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line-soft px-5 py-4 last:border-b-0 @xl:grid-cols-[minmax(0,1fr)_7.5rem_6.875rem_7.5rem]">
                <div className="flex flex-col">
                  <b className="text-ui">{b.label}</b>
                  <span className="text-caption text-ink-muted">{isPaid ? "payée aujourd'hui" : b.date}</span>
                </div>
                <b className="tabular text-right text-md">{formatEuro(b.amount)}</b>
                <Badge tone={isPaid ? "ok" : b.tone}>{isPaid ? "Payée" : b.status}</Badge>
                <div className="justify-self-end @xl:justify-self-stretch">
                  {b.payable && !isPaid && (
                    <Button
                      size="sm"
                      className="w-full"
                      aria-label={`Payer ${b.label}, ${formatEuro(b.amount)}`}
                      onClick={() => {
                        setPaid((p) => [...p, b.label]);
                        toast({ title: `Paiement de ${formatEuro(b.amount)} effectué` });
                      }}
                    >
                      Payer
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
