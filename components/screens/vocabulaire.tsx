"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getVocabStats, removeVocabDeck, reviewVocabCard, saveVocabDeck } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { VocabCard, VocabDeck } from "@/lib/data/tools";
import { formatDateShort } from "@/lib/format";

/** « mot = traduction » (ou tabulation, « ; », « : ») : une carte par ligne. */
const parseCards = (text: string) =>
  text
    .split("\n")
    .map((l) => l.split(/\s*(?:=|\t|;|\s:\s)\s*/))
    .filter((p) => p.length >= 2 && p[0].trim() && p.slice(1).join(" ").trim())
    .map((p) => ({ front: p[0].trim().slice(0, 200), back: p.slice(1).join(" ").trim().slice(0, 200) }));

const isDue = (c: VocabCard, today: string) => !c.due || c.due <= today;

function DeckEditor({
  deck,
  classes,
  trigger,
}: {
  deck?: VocabDeck;
  classes: { id: string; name: string }[];
  trigger: React.ReactNode;
}) {
  const toast = useToast();
  const router = useRouter();
  const initial = () => (deck ? deck.cards.map((c) => `${c.front} = ${c.back}`).join("\n") : "");
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState(deck?.classId ?? classes[0]?.id ?? "");
  const [title, setTitle] = useState(deck?.title ?? "");
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const cards = parseCards(text);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setTitle(deck?.title ?? "");
          setText(initial());
          setError(null);
        }
      }}
      title={deck ? "Modifier la liste" : "Nouvelle liste de vocabulaire"}
      description="Une carte par ligne : le mot, un signe =, puis sa traduction. Par exemple : la maison = la casa"
      className="w-[min(40rem,calc(100vw-2rem))]"
      trigger={trigger}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return setError("Donnez un titre à la liste.");
          if (!cards.length) return setError("Écrivez au moins une carte, sous la forme « mot = traduction ».");
          setError(null);
          start(async () => {
            const r = await saveVocabDeck(deck?.id ?? null, deck ? null : classId, title.trim(), cards);
            if (!r.ok) return setError(r.error ?? "");
            toast({ title: deck ? "Liste modifiée" : "Liste créée" });
            setOpen(false);
            if (!deck) {
              setTitle("");
              setText("");
            }
            router.refresh();
          });
        }}
      >
        {!deck && (
          <SelectField label="Classe" options={classes.map((c) => ({ value: c.id, label: c.name }))} value={classId} onValueChange={setClassId} />
        )}
        <TextField label="Titre" value={title} maxLength={120} placeholder="Italien · la maison" onChange={(e) => setTitle(e.target.value)} required />
        <TextAreaField
          label="Cartes"
          hint={`${cards.length} carte${cards.length > 1 ? "s" : ""} reconnue${cards.length > 1 ? "s" : ""} (200 au plus). La progression des élèves est gardée pour les cartes inchangées.`}
          value={text}
          rows={10}
          onChange={(e) => setText(e.target.value)}
        />
        {error && (
          <p role="alert" className="m-0 text-label text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 px-4 text-label">
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function DeckStats({ deck }: { deck: VocabDeck }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<{ name: string; known: number; seen: number; total: number; last_seen: string | null }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setRows(null);
          getVocabStats(deck.id).then((r) => (r.ok ? setRows(r.rows) : setError(r.error)));
        }
      }}
      title={`Suivi · ${deck.title}`}
      description="Une carte est sue quand l'élève l'a réussie plusieurs fois de suite, à quelques jours d'écart."
      trigger={
        <Button variant="secondary" className="h-10 px-3.5 text-label">
          Suivi
        </Button>
      }
    >
      {error ? (
        <p className="m-0 text-label text-danger">{error}</p>
      ) : !rows ? (
        <p className="m-0 text-label text-ink-2">Chargement…</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {rows.map((r) => (
            <li key={r.name} className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft py-2.5 last:border-b-0">
              <b className="text-ui">{r.name}</b>
              <span className="text-label text-ink-2">
                {r.known}/{r.total} sues · {r.seen} vues
                {r.last_seen ? ` · ${formatDateShort(r.last_seen)}` : " · jamais révisé"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

/** Révision : la carte, « Voir la réponse », puis « Je savais » ou « À revoir ». */
function Study({ deck, today, onClose }: { deck: VocabDeck; today: string; onClose: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [reverse, setReverse] = useState(false);
  const [queue, setQueue] = useState(() => {
    const due = deck.cards.filter((c) => isDue(c, today));
    return (due.length ? due : deck.cards).map((c) => c.id).sort(() => Math.random() - 0.5);
  });
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [, start] = useTransition();
  const card = deck.cards.find((c) => c.id === queue[0]);

  const answer = (known: boolean) => {
    if (!card) return;
    start(async () => {
      const r = await reviewVocabCard(card.id, known);
      if (!r.ok) toast({ title: r.error });
    });
    setFlipped(false);
    setDone((d) => d + 1);
    // Carte ratée : elle revient en fin de série.
    setQueue((q) => (known ? q.slice(1) : [...q.slice(1), q[0]]));
  };

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <b className="font-display text-h3">{deck.title}</b>
        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-label">
          <Checkbox checked={reverse} onCheckedChange={setReverse} />
          Sens inverse
        </label>
      </div>
      {card ? (
        <>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-live="polite"
            className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-card border-2 border-line bg-surface-2 px-5 py-8 text-center hover:border-line-strong"
          >
            <span className="font-display text-[clamp(1.5rem,5vw,2.5rem)] leading-tight font-bold">
              {reverse ? card.back : card.front}
            </span>
            {flipped ? (
              <span className="text-h3 font-bold text-brand">{reverse ? card.front : card.back}</span>
            ) : (
              <span className="text-label text-ink-muted">Touchez pour voir la réponse</span>
            )}
          </button>
          {flipped ? (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" icon="replay" className="h-12" onClick={() => answer(false)}>
                À revoir
              </Button>
              <Button icon="check" className="h-12" onClick={() => answer(true)}>
                Je savais
              </Button>
            </div>
          ) : (
            <Button className="h-12" onClick={() => setFlipped(true)}>
              Voir la réponse
            </Button>
          )}
          <p className="m-0 text-center text-caption text-ink-muted">
            {queue.length} carte{queue.length > 1 ? "s" : ""} dans la série · {done} révisée{done > 1 ? "s" : ""}
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Icon name="emoji_events" size={40} className="text-warn" />
          <p className="m-0 text-h3 font-bold">Série terminée !</p>
          <p className="m-0 text-label text-ink-2">Les cartes reviendront au bon moment pour bien les retenir.</p>
          <Button
            className="h-11 px-5"
            onClick={() => {
              onClose();
              router.refresh();
            }}
          >
            Terminer
          </Button>
        </div>
      )}
    </div>
  );
}

/** Cartes de vocabulaire : le professeur crée les listes de ses classes ; l'élève les révise. */
export function VocabulaireScreen({
  decks,
  classes,
  staff,
  student,
  today,
}: {
  decks: VocabDeck[];
  classes: { id: string; name: string }[];
  staff: boolean;
  student: boolean;
  today: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [studying, setStudying] = useState<string | null>(null);
  const [, start] = useTransition();
  const current = decks.find((d) => d.id === studying);
  if (current) return <Study deck={current} today={today} onClose={() => setStudying(null)} />;

  return (
    <div className="flex flex-col gap-4">
      {staff && classes.length > 0 && (
        <div className="flex justify-end">
          <DeckEditor
            classes={classes}
            trigger={
              <Button icon="add" className="h-10 px-4 text-label">
                Nouvelle liste
              </Button>
            }
          />
        </div>
      )}
      {decks.length ? (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {decks.map((d) => {
            const due = d.cards.filter((c) => isDue(c, today)).length;
            const known = d.cards.filter((c) => c.box >= 4).length;
            return (
              <li key={d.id} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
                <div className="flex flex-col gap-0.5">
                  <b className="font-display text-h3">{d.title}</b>
                  <span className="text-caption text-ink-muted">
                    {d.className} · {d.cards.length} carte{d.cards.length > 1 ? "s" : ""}
                    {student && ` · ${known} sue${known > 1 ? "s" : ""}`}
                  </span>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  {student && (
                    <Button icon="style" className="h-10 px-4 text-label" onClick={() => setStudying(d.id)}>
                      {due ? `Réviser (${due} à revoir)` : "Réviser quand même"}
                    </Button>
                  )}
                  {staff && (
                    <>
                      <DeckStats deck={d} />
                      {d.mine && (
                        <>
                          <DeckEditor
                            deck={d}
                            classes={classes}
                            trigger={
                              <Button variant="secondary" icon="edit" className="h-10 px-3.5 text-label">
                                Modifier
                              </Button>
                            }
                          />
                          <button
                            type="button"
                            aria-label={`Supprimer ${d.title}`}
                            className="flex size-10 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
                            onClick={() => {
                              if (!window.confirm(`Supprimer la liste « ${d.title} » ?`)) return;
                              start(async () => {
                                const r = await removeVocabDeck(d.id);
                                toast({ title: r.ok ? "Liste supprimée" : r.error });
                                if (r.ok) router.refresh();
                              });
                            }}
                          >
                            <Icon name="delete" size={20} />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
          {staff ? "Aucune liste : créez la première pour une de vos classes." : "Aucune liste de vocabulaire pour l'instant."}
        </p>
      )}
    </div>
  );
}
