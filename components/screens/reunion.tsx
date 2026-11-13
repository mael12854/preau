"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  bookMeetingSlot,
  cancelMeetingBooking,
  closeMeetingSlot,
  openMeetingSlots,
  saveMeetingReport,
  setMeetingOpen,
} from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Dialog } from "@/components/ui/dialog";
import { TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { MeetingBoard, MeetingReport } from "@/lib/data/meetings";
import { parseScore, scoreShort } from "@/lib/grading";
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

type Booking = NonNullable<MeetingBoard["my_slots"][number]["booking"]>;

// ── Professeur : bilan du rendez-vous et note sur 20 dans chaque matière qu'il enseigne à l'élève ──
function ReportDialog({ booking }: { booking: Booking }) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(booking.report?.summary ?? "");
  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      booking.subjects.map((sub) => {
        const v = booking.report?.scores.find((x) => x.subject_id === sub.id)?.score;
        return [sub.id, v === undefined ? "" : String(v).replace(".", ",")];
      }),
    ),
  );
  const [all, setAll] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const done = !!booking.report;
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={`Bilan · ${booking.student}`}
      description="Le bilan et les notes sont visibles par l'élève et sa famille. Chaque note compte comme une évaluation « Bilan RPP » dans la matière."
      trigger={
        <Button size="sm" variant={done ? "secondary" : "primary"}>
          {done ? "Modifier le bilan" : "Rédiger le bilan"}
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const bad = booking.subjects.find((sub) => parseScore(scores[sub.id] ?? "") == null);
          if (bad) return setError(`Mettez une note entre 0 et 20 (au demi-point) en ${bad.name}.`);
          start(async () => {
            const r = await saveMeetingReport(booking.id, summary, scores);
            if (!r.ok) return setError(r.error);
            toast({ title: done ? "Bilan modifié" : "Bilan enregistré, la famille est prévenue" });
            setOpen(false);
            router.refresh();
          });
        }}
      >
        <TextAreaField
          label="Bilan du rendez-vous"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={4000}
          rows={5}
          required
        />
        {booking.subjects.length > 0 && (
          <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
            <legend className="mb-2 text-label font-bold">Note sur 20 par matière</legend>
            {booking.subjects.length > 1 && (
              <div className="flex items-end gap-2">
                <TextField label="Même note partout" inputMode="decimal" value={all} onChange={(e) => setAll(e.target.value)} placeholder="ex. 14,5" />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 px-3 text-label"
                  onClick={() => setScores(Object.fromEntries(booking.subjects.map((sub) => [sub.id, all])))}
                >
                  Appliquer
                </Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {booking.subjects.map((sub) => (
                <TextField
                  key={sub.id}
                  label={sub.name}
                  inputMode="decimal"
                  value={scores[sub.id] ?? ""}
                  onChange={(e) => setScores((x) => ({ ...x, [sub.id]: e.target.value }))}
                  required
                />
              ))}
            </div>
          </fieldset>
        )}
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 px-4 text-label">
            {pending ? "Enregistrement…" : "Enregistrer le bilan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Bilan affiché à la famille et à l'élève (et rappel pour le professeur). */
function ReportView({ report }: { report: MeetingReport }) {
  return (
    <div className="mt-1.5 flex flex-col gap-1.5 rounded-control bg-surface-2 px-3 py-2.5">
      <span className="text-caption font-bold text-ink-muted">Bilan du rendez-vous</span>
      <p className="m-0 text-label whitespace-pre-line">{report.summary}</p>
      {report.scores.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {report.scores.map((x) => (
            <li key={x.subject_id} className="rounded-[5px] border border-line bg-surface px-2 py-0.5 text-caption">
              {x.name} <b className="tabular">{scoreShort(Number(x.score), "NE")}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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
                      <span className="flex flex-wrap items-center gap-2">
                        <b className="text-ui">{s.booking.student}</b>
                        {s.booking.can_report &&
                          (s.booking.report ? <Badge tone="ok">Bilan rédigé</Badge> : <Badge tone="warn">Bilan à rédiger</Badge>)}
                      </span>
                      <span className="text-caption text-ink-2">avec {s.booking.parent}</span>
                      {s.booking.report && <ReportView report={s.booking.report} />}
                    </>
                  ) : (
                    <span className="text-ui text-ink-muted">Libre</span>
                  )}
                  <span className="text-caption text-ink-muted">{where(s.place, s.visio_url)}</span>
                </span>
                <span className="flex gap-1.5 print:hidden">
                  {s.booking?.can_report && <ReportDialog booking={s.booking} />}
                  {s.booking && !s.booking.can_report && (
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
function FamilyPanel({ board, student }: { board: MeetingBoard; student: boolean }) {
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
                    {student ? "" : `pour ${b.student} · `}
                    {where(b.place, b.visio_url)}
                  </span>
                  {b.visio_url && (
                    <a href={b.visio_url} target="_blank" rel="noopener noreferrer" className="w-fit text-caption font-bold text-brand hover:underline">
                      Rejoindre la visio
                    </a>
                  )}
                  {b.report && <ReportView report={b.report} />}
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
          Annulation possible jusqu&apos;à {m.cancel_hours ? `${m.cancel_hours} h avant le rendez-vous` : "l'heure du rendez-vous"}. {student ? "Un seul créneau par professeur." : "Un seul créneau par professeur et par enfant."}
        </p>
      </section>

      {board.children.map((child) => (
        <section key={child.student_id} className="flex flex-col gap-3 print:hidden">
          <h2 className="m-0 font-display text-h3 font-bold">{student ? "Réserver un créneau" : `Réserver pour ${child.name}`}</h2>
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
export function MeetingScreen({
  board,
  teacher,
  admin,
  student = false,
}: {
  board: MeetingBoard;
  teacher: boolean;
  admin: boolean;
  /** L'élève réserve ses propres rendez-vous. */
  student?: boolean;
}) {
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
      {family && <FamilyPanel board={board} student={student} />}
      {!teacher && !family && (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">
          Les créneaux de chaque professeur couvrent toute la plage ; un professeur peut en retirer ou en rouvrir. Les familles réservent depuis leur espace tant qu’il reste de la place.
        </p>
      )}
    </div>
  );
}
