"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  bookMeetingSlot,
  cancelMeetingBooking,
  closeMeetingSlot,
  openMeetingSlots,
  setMeetingOpen,
} from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { MeetingBoard } from "@/lib/data/meetings";
import { formatDateLong, formatTimeText } from "@/lib/format";

const where = (place: string | null, visio: string | null) =>
  [place, visio ? "visio" : null].filter(Boolean).join(" · ") || "Lieu à préciser";

function useAction() {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    start(async () => {
      const r = await fn();
      toast({ title: r.ok ? ok : (r.error ?? "") });
      if (r.ok) router.refresh();
    });
  };
  return { pending, act };
}

// ── Professeur : ouvrir ses créneaux, son planning ──
function TeacherPanel({ board }: { board: MeetingBoard }) {
  const { pending, act } = useAction();
  const toast = useToast();
  const router = useRouter();
  const m = board.meeting;
  const [from, setFrom] = useState(m.starts);
  const [to, setTo] = useState(m.ends);
  const [place, setPlace] = useState("");
  const [visio, setVisio] = useState("");
  const [opening, start] = useTransition();
  const booked = board.my_slots.filter((s) => s.booking).length;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 font-display text-h3 font-bold">Mon planning</h2>
      <form
        className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 print:hidden"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await openMeetingSlots(m.id, from, to, place, visio);
            toast({
              title: r.ok
                ? r.count
                  ? `${r.count} créneau${r.count > 1 ? "x" : ""} de ${m.slot_minutes} min ouvert${r.count > 1 ? "s" : ""}`
                  : "Aucun nouveau créneau : ils existent déjà sur cette plage."
                : (r.error ?? ""),
            });
            if (r.ok) router.refresh();
          });
        }}
      >
        <b className="text-ui">Ouvrir des créneaux de {m.slot_minutes} min</b>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TextField label="De" type="time" min={m.starts} max={m.ends} value={from} onChange={(e) => setFrom(e.target.value)} required />
          <TextField label="À" type="time" min={m.starts} max={m.ends} value={to} onChange={(e) => setTo(e.target.value)} required />
          <TextField label="Salle" placeholder="Salle 201" value={place} maxLength={80} onChange={(e) => setPlace(e.target.value)} />
          <TextField label="Lien visio (facultatif)" type="url" placeholder="https://…" value={visio} onChange={(e) => setVisio(e.target.value)} />
        </div>
        <Button type="submit" disabled={opening} className="h-11 w-fit px-4 text-label">
          {opening ? "Ouverture…" : "Ouvrir les créneaux"}
        </Button>
      </form>
      {board.my_slots.length === 0 ? (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">Aucun créneau ouvert pour l&apos;instant.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-label text-ink-2">
              {booked} rendez-vous sur {board.my_slots.length} créneaux
            </span>
            <Button variant="secondary" icon="print" className="h-10 px-3.5 text-label print:hidden" onClick={() => window.print()}>
              Imprimer
            </Button>
          </div>
          <ul className="m-0 list-none overflow-hidden rounded-card border border-line bg-surface p-0">
            {board.my_slots.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0">
                <b className="w-24 text-ui tabular">
                  {formatTimeText(s.starts_at)}–{formatTimeText(s.ends_at)}
                </b>
                <span className="flex min-w-0 flex-1 flex-col">
                  {s.booking ? (
                    <>
                      <b className="text-ui">{s.booking.student}</b>
                      <span className="text-caption text-ink-2">avec {s.booking.parent}</span>
                    </>
                  ) : (
                    <span className="text-ui text-ink-muted">Libre</span>
                  )}
                  <span className="text-caption text-ink-muted">{where(s.place, s.visio_url)}</span>
                </span>
                <span className="flex gap-1.5 print:hidden">
                  {s.booking && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pending}
                      onClick={() =>
                        act(() => cancelMeetingBooking(s.booking!.id), "Rendez-vous annulé, la famille est prévenue", `Annuler le rendez-vous de ${s.booking!.student} ? La famille sera prévenue.`)
                      }
                    >
                      Annuler le rdv
                    </Button>
                  )}
                  <button
                    type="button"
                    aria-label={`Retirer le créneau de ${formatTimeText(s.starts_at)}`}
                    disabled={pending}
                    onClick={() =>
                      act(
                        () => closeMeetingSlot(s.id),
                        "Créneau retiré",
                        s.booking ? "Retirer ce créneau ? Le rendez-vous sera annulé et la famille prévenue." : undefined,
                      )
                    }
                    className="flex size-9 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

// ── Famille : réserver, son parcours ──
function FamilyPanel({ board }: { board: MeetingBoard }) {
  const { pending, act } = useAction();
  const m = board.meeting;
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 font-display text-h3 font-bold">Mon parcours</h2>
          {board.my_bookings.length > 0 && (
            <Button variant="secondary" icon="print" className="h-10 px-3.5 text-label print:hidden" onClick={() => window.print()}>
              Imprimer
            </Button>
          )}
        </div>
        {board.my_bookings.length === 0 ? (
          <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">
            Aucun rendez-vous pour l&apos;instant : choisissez un créneau ci-dessous.
          </p>
        ) : (
          <ol className="m-0 list-none overflow-hidden rounded-card border border-line bg-surface p-0">
            {board.my_bookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0">
                <b className="w-24 text-ui tabular">
                  {formatTimeText(b.starts_at)}–{formatTimeText(b.ends_at)}
                </b>
                <span className="flex min-w-0 flex-1 flex-col">
                  <b className="text-ui">{b.teacher}</b>
                  <span className="text-caption text-ink-2">
                    pour {b.student} · {where(b.place, b.visio_url)}
                  </span>
                  {b.visio_url && (
                    <a href={b.visio_url} target="_blank" rel="noopener noreferrer" className="w-fit text-caption font-bold text-brand hover:underline">
                      Rejoindre la visio
                    </a>
                  )}
                </span>
                {b.can_cancel ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    className="print:hidden"
                    onClick={() => act(() => cancelMeetingBooking(b.id), "Rendez-vous annulé", `Annuler le rendez-vous avec ${b.teacher} ?`)}
                  >
                    Annuler
                  </Button>
                ) : (
                  <span className="text-caption text-ink-muted print:hidden">Annulation en ligne close</span>
                )}
              </li>
            ))}
          </ol>
        )}
        <p className="m-0 text-caption text-ink-muted print:hidden">
          Annulation possible jusqu&apos;à {m.cancel_hours ? `${m.cancel_hours} h avant le rendez-vous` : "l'heure du rendez-vous"}. Un seul créneau par
          professeur et par enfant.
        </p>
      </section>

      {board.children.map((child) => (
        <section key={child.student_id} className="flex flex-col gap-3 print:hidden">
          <h2 className="m-0 font-display text-h3 font-bold">Réserver pour {child.name}</h2>
          {!m.open && <p className="m-0 text-label text-ink-2">Les réservations sont fermées.</p>}
          {child.teachers.length === 0 ? (
            <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">
              Aucun professeur n&apos;a encore ouvert de créneaux.
            </p>
          ) : (
            child.teachers.map((t) => {
              const has = t.slots.some((s) => s.state === "mine");
              return (
                <div key={t.teacher_id} className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
                  <span className="flex items-center justify-between gap-2">
                    <b className="text-ui">{t.name}</b>
                    {has && <Badge tone="ok">Rendez-vous pris</Badge>}
                  </span>
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {t.slots.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          disabled={pending || !m.open || s.state !== "free" || has}
                          aria-pressed={s.state === "mine"}
                          onClick={() =>
                            act(
                              () => bookMeetingSlot(s.id, child.student_id),
                              `Rendez-vous réservé avec ${t.name} à ${formatTimeText(s.starts_at)}`,
                            )
                          }
                          className={cn(
                            "h-11 min-w-[4.5rem] rounded-control border-[1.5px] px-3 text-label font-bold tabular",
                            s.state === "mine"
                              ? "border-brand bg-brand text-on-brand"
                              : s.state === "taken"
                                ? "border-line bg-neutral-bg text-ink-muted line-through"
                                : "border-line bg-surface text-ink hover:border-brand disabled:opacity-50 disabled:hover:border-line",
                          )}
                          aria-label={`${formatTimeText(s.starts_at)} avec ${t.name}${s.state === "taken" ? ", déjà pris" : s.state === "mine" ? ", votre rendez-vous" : ""}`}
                        >
                          {formatTimeText(s.starts_at)}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {t.slots[0] && <span className="text-caption text-ink-muted">{where(t.slots[0].place, t.slots[0].visio_url)}</span>}
                </div>
              );
            })
          )}
        </section>
      ))}
    </div>
  );
}

/** Une réunion parents-profs : planning du professeur, réservations et parcours des familles. */
export function MeetingScreen({ board, teacher, admin }: { board: MeetingBoard; teacher: boolean; admin: boolean }) {
  const { pending, act } = useAction();
  const m = board.meeting;
  const family = board.children.length > 0 || board.my_bookings.length > 0;
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4">
        <div className="flex flex-col gap-1">
          <b className="font-display text-h2">{m.title}</b>
          <span className="text-label text-ink-2">
            {formatDateLong(m.day, true)} · {m.starts} – {m.ends} · créneaux de {m.slot_minutes} min
          </span>
          {m.classes && <span className="text-caption text-ink-muted">{m.classes.join(", ")}</span>}
        </div>
        <span className="flex items-center gap-2">
          <Badge tone={m.open ? "ok" : "warn"}>{m.open ? "Réservations ouvertes" : "Réservations fermées"}</Badge>
          {(admin || m.mine) && (
            <Button
              variant="secondary"
              className="h-10 px-3.5 text-label print:hidden"
              disabled={pending}
              onClick={() => act(() => setMeetingOpen(m.id, !m.open), m.open ? "Réservations fermées" : "Réservations ouvertes")}
            >
              {m.open ? "Fermer les réservations" : "Ouvrir les réservations"}
            </Button>
          )}
        </span>
      </section>
      {teacher && <TeacherPanel board={board} />}
      {family && <FamilyPanel board={board} />}
      {!teacher && !family && (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">
          Les créneaux de chaque professeur couvrent toute la plage ; un professeur peut en retirer ou en rouvrir. Les familles réservent depuis leur espace tant qu’il reste de la place.
        </p>
      )}
    </div>
  );
}
