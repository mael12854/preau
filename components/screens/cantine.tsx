"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { adjustCanteenBalance, createInvoices, saveMenu, setCanteenSettings, settleInvoice } from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { SegmentedTabs } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import type { CanteenAdmin } from "@/lib/data/canteen";
import { addDays, formatCents, formatDateShort } from "@/lib/format";

/** « 4,50 » ou « 4.5 » → 450 centimes ; vide ou invalide → null. */
const toCents = (v: string) => {
  const n = Number(v.trim().replace(",", "."));
  return v.trim() && Number.isFinite(n) ? Math.round(n * 100) : null;
};

function Menus({ data, today }: { data: CanteenAdmin; today: string }) {
  const toast = useToast();
  const router = useRouter();
  const [texts, setTexts] = useState(() => Object.fromEntries(data.days.map((d) => [d.day, d.items.join("\n")])));
  const [pending, start] = useTransition();
  const save = (day: string) =>
    start(async () => {
      const r = await saveMenu(day, (texts[day] ?? "").split("\n"));
      toast({ title: r.ok ? `Menu du ${formatDateShort(day)} enregistré` : r.error });
      if (r.ok) router.refresh();
    });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <b className="text-ui">Semaine du {formatDateShort(data.monday)}</b>
        <span className="flex gap-2">
          <Link href={`/cantine?semaine=${addDays(data.monday, -7)}`} className="rounded-control border border-line px-3 py-2 text-label font-bold">
            ← Semaine précédente
          </Link>
          <Link href={`/cantine?semaine=${today}`} className="rounded-control border border-line px-3 py-2 text-label font-bold">
            Cette semaine
          </Link>
          <Link href={`/cantine?semaine=${addDays(data.monday, 7)}`} className="rounded-control border border-line px-3 py-2 text-label font-bold">
            Semaine suivante →
          </Link>
        </span>
      </div>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {data.days.map((d) => (
          <li key={d.day} className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
            <TextAreaField
              label={formatDateShort(d.day)}
              hint="Un plat par ligne. Vide : pas de menu ce jour-là."
              rows={4}
              value={texts[d.day] ?? ""}
              onChange={(e) => setTexts((t) => ({ ...t, [d.day]: e.target.value }))}
            />
            <Button variant="secondary" className="h-10 w-fit px-4 text-label" disabled={pending} onClick={() => save(d.day)}>
              Enregistrer
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BalanceDialog({ student }: { student: CanteenAdmin["students"][number] }) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sign, setSign] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Paiement en espèces");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setError(undefined);
      }}
      title={`Solde de ${student.name}`}
      description={`Solde actuel : ${formatCents(student.balanceCents ?? 0)}`}
      trigger={
        <Button size="sm" variant="secondary">
          Modifier
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const cents = toCents(amount);
          if (!cents || cents <= 0) return setError("Indiquez un montant en euros, par exemple 20 ou 4,50.");
          start(async () => {
            const r = await adjustCanteenBalance(student.id, sign === "credit" ? cents : -cents, reason);
            if (!r.ok) return setError(r.error);
            setOpen(false);
            setAmount("");
            toast({ title: "Solde mis à jour" });
            router.refresh();
          });
        }}
      >
        <SelectField
          label="Mouvement"
          options={[
            { value: "credit", label: "Ajouter (paiement, remboursement…)" },
            { value: "debit", label: "Retirer (repas, correction…)" },
          ]}
          value={sign}
          onValueChange={(v) => {
            setSign(v as "credit" | "debit");
            setReason(v === "credit" ? "Paiement en espèces" : "Repas");
          }}
        />
        <TextField label="Montant (€)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <TextField label="Motif" value={reason} maxLength={120} onChange={(e) => setReason(e.target.value)} required />
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 px-4 text-label">
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function Balances({ data }: { data: CanteenAdmin }) {
  const [q, setQ] = useState("");
  const list = data.students.filter((s) => `${s.name} ${s.className}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="flex flex-col gap-3">
      <TextField label="Chercher un élève" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      {list.length === 0 ? (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">Aucun élève.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col overflow-hidden rounded-card border border-line bg-surface p-0">
          {list.map((s) => {
            const low = s.balanceCents !== null && s.balanceCents < data.mealPriceCents;
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-3 last:border-b-0">
                <span className="flex min-w-0 flex-1 flex-col">
                  <b className="text-ui">{s.name}</b>
                  <span className="text-caption text-ink-muted">{s.className}</span>
                </span>
                <span className={`text-ui font-bold tabular ${low ? "text-danger" : ""}`}>
                  {s.balanceCents === null ? "—" : formatCents(s.balanceCents)}
                </span>
                {low && <Badge tone="danger">Solde bas</Badge>}
                <BalanceDialog student={s} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const STATUS: Record<CanteenAdmin["invoices"][number]["status"], { label: string; tone: "warn" | "ok" | "neutral" }> = {
  a_payer: { label: "À payer", tone: "warn" },
  payee: { label: "Payée", tone: "ok" },
  creditee: { label: "Annulée", tone: "neutral" },
};

function Invoices({ data, today }: { data: CanteenAdmin; today: string }) {
  const toast = useToast();
  const router = useRouter();
  const [target, setTarget] = useState(data.classes[0] ? `classe:${data.classes[0].id}` : "");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState(addDays(today, 14));
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const targets = useMemo(
    () => [
      ...data.classes.map((c) => ({ value: `classe:${c.id}`, label: `Toute la classe · ${c.name} (${c.studentIds.length})` })),
      ...data.students.map((s) => ({ value: `eleve:${s.id}`, label: `${s.name} · ${s.className}` })),
    ],
    [data],
  );
  const ids = target.startsWith("classe:")
    ? (data.classes.find((c) => `classe:${c.id}` === target)?.studentIds ?? [])
    : target
      ? [target.slice(6)]
      : [];
  const settle = (id: string, method: string) =>
    start(async () => {
      if (method === "annulee" && !window.confirm("Annuler cette facture ? La famille n'aura plus à la payer.")) return;
      const r = await settleInvoice(id, method);
      toast({ title: r.ok ? (method === "annulee" ? "Facture annulée" : "Facture marquée payée") : r.error });
      if (r.ok) router.refresh();
    });
  return (
    <div className="flex flex-col gap-5">
      <form
        className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const cents = toCents(amount);
          if (!label.trim()) return setError("Indiquez l'objet de la facture.");
          if (!cents || cents <= 0) return setError("Indiquez un montant en euros, par exemple 12 ou 7,50.");
          if (!ids.length) return setError("Choisissez une classe ou un élève.");
          setError(undefined);
          start(async () => {
            const r = await createInvoices(ids, label.trim(), cents, due);
            if (!r.ok) return setError(r.error);
            toast({ title: ids.length > 1 ? `${ids.length} factures créées` : "Facture créée" });
            setLabel("");
            setAmount("");
            router.refresh();
          });
        }}
      >
        <b className="text-ui">Nouvelle facture</b>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Pour" options={targets} value={target} onValueChange={setTarget} />
          <TextField label="Objet" placeholder="Sortie au musée" value={label} maxLength={120} onChange={(e) => setLabel(e.target.value)} />
          <TextField label="Montant par élève (€)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <TextField label="À payer avant le" type="date" min={today} value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        <Button type="submit" disabled={pending} className="h-11 w-fit px-5">
          {pending ? "Création…" : ids.length > 1 ? `Créer ${ids.length} factures` : "Créer la facture"}
        </Button>
        <p className="m-0 text-caption text-ink-muted">Les familles la voient dans « Paiements & cantine » et peuvent la payer en ligne.</p>
      </form>
      {data.invoices.length === 0 ? (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">Aucune facture pour l&apos;instant.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col overflow-hidden rounded-card border border-line bg-surface p-0">
          {data.invoices.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-3 last:border-b-0">
              <span className="flex min-w-0 flex-1 flex-col">
                <b className="text-ui">{f.label}</b>
                <span className="text-caption text-ink-muted">
                  {f.student}
                  {f.dueOn && ` · avant le ${formatDateShort(f.dueOn)}`}
                  {f.status === "payee" && f.paidOn && ` · payée le ${formatDateShort(f.paidOn)}${f.method ? ` (${f.method})` : ""}`}
                </span>
              </span>
              <span className="text-ui font-bold tabular">{formatCents(f.amountCents)}</span>
              <Badge tone={STATUS[f.status].tone}>{STATUS[f.status].label}</Badge>
              {f.status === "a_payer" && (
                <span className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => settle(f.id, "Espèces")}>
                    Payée en espèces
                  </Button>
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => settle(f.id, "Chèque")}>
                    Par chèque
                  </Button>
                  <button
                    type="button"
                    aria-label={`Annuler la facture ${f.label} de ${f.student}`}
                    disabled={pending}
                    onClick={() => settle(f.id, "annulee")}
                    className="flex size-9 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Settings({ data }: { data: CanteenAdmin }) {
  const toast = useToast();
  const router = useRouter();
  const [enabled, setEnabled] = useState(data.enabled);
  const [price, setPrice] = useState((data.mealPriceCents / 100).toFixed(2).replace(".", ","));
  const [pending, start] = useTransition();
  return (
    <form
      className="flex max-w-md flex-col gap-4 rounded-card border border-line bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const cents = toCents(price);
        if (cents === null || cents < 0) return toast({ title: "Prix du repas invalide." });
        start(async () => {
          const r = await setCanteenSettings(enabled, cents);
          toast({ title: r.ok ? "Réglages enregistrés" : r.error });
          if (r.ok) router.refresh();
        });
      }}
    >
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-ui">
        <Checkbox checked={enabled} onCheckedChange={setEnabled} />
        L&apos;école a une cantine
      </label>
      <TextField label="Prix du repas (€)" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
      <p className="m-0 text-caption text-ink-muted">
        Sans cantine, les familles ne voient que les factures. Le prix sert à afficher le nombre de repas restants.
      </p>
      <Button type="submit" disabled={pending} className="h-11 w-fit px-5">
        Enregistrer
      </Button>
    </form>
  );
}

/** Gestion de la cantine : menus, soldes, factures et réglages (secrétariat, direction). */
export function CantineScreen({ data, today }: { data: CanteenAdmin; today: string }) {
  return (
    <SegmentedTabs
      aria-label="Gestion de la cantine"
      defaultValue={data.enabled ? "menus" : "factures"}
      tabs={[
        ...(data.enabled
          ? [
              { value: "menus", label: "Menus", content: <Menus data={data} today={today} /> },
              { value: "soldes", label: "Soldes", content: <Balances data={data} /> },
            ]
          : []),
        { value: "factures", label: "Factures", content: <Invoices data={data} today={today} /> },
        { value: "reglages", label: "Réglages", content: <Settings data={data} /> },
      ]}
    />
  );
}
