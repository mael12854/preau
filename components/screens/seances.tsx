"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveLessonNote } from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { SubjectChip } from "@/components/ui/subject-chip";
import { useToast } from "@/components/ui/toast";
import type { NoteLesson } from "@/lib/data/homework";
import type { HomeworkView, LessonNoteView } from "@/lib/data/types";
import { cn } from "@/lib/cn";
import { formatDateLong, formatMonth, formatTimeText, isoDay } from "@/lib/format";
import { AttachmentList, FilePicker, uploadAttachments } from "./attachments";

const when = (startsAt: string) => `${formatDateLong(startsAt, true)} · ${formatTimeText(startsAt)}`;

/** Contenu de séance : l'enseignant choisit un de ses cours (3 semaines passées, 1 à venir), écrit ce qui a été fait, joint des fichiers. */
export function LessonNoteEditor({
  lessons,
  initialLesson,
  trigger,
}: {
  lessons: NoteLesson[];
  initialLesson?: string;
  /** Bouton d'ouverture (par défaut « Contenu de séance »). */
  trigger?: React.ReactNode;
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Par défaut : le cours le plus récent déjà commencé (choisi côté serveur).
  const [lessonId, setLessonId] = useState(initialLesson ?? lessons[0]?.id ?? "");
  const lesson = lessons.find((l) => l.id === lessonId);
  const [content, setContent] = useState(lesson?.content ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!lessons.length) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setContent(lessons.find((l) => l.id === lessonId)?.content ?? "");
          setFiles([]);
          setError(null);
        }
      }}
      title="Contenu de séance"
      description="Ce qui a été fait en cours. Les élèves de la classe et leurs familles le voient dans le cahier de textes."
      trigger={
        trigger ?? (
          <Button variant="secondary" icon="edit_note" className="h-10 px-4 text-label">
            Contenu de séance
          </Button>
        )
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!lesson) return;
          if (!content.trim()) return setError("Décrivez le contenu de la séance.");
          setError(null);
          start(async () => {
            const r = await saveLessonNote(lesson.id, content.trim());
            if (!r.ok) return setError(r.error);
            const failed = files.length ? await uploadAttachments({ lessonId: lesson.id }, files) : null;
            if (failed) {
              router.refresh();
              return setError(`Contenu enregistré, mais une pièce jointe n'est pas partie. ${failed}`);
            }
            toast({ title: lesson.content ? "Contenu de séance modifié" : "Contenu de séance enregistré" });
            setOpen(false);
            setFiles([]);
            router.refresh();
          });
        }}
      >
        <SelectField
          label="Cours"
          options={lessons.map((l) => ({
            value: l.id,
            label: `${l.label} · ${when(l.startsAt)}${l.content ? " ✓" : ""}`,
          }))}
          value={lessonId}
          onValueChange={(v) => {
            setLessonId(v);
            setContent(lessons.find((l) => l.id === v)?.content ?? "");
            setFiles([]);
          }}
        />
        <TextAreaField
          label="Contenu de la séance"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={4000}
          rows={6}
          placeholder="Notions vues, exercices faits, documents distribués…"
          required
        />
        {lesson && lesson.files.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-label font-bold">Pièces jointes</span>
            <AttachmentList files={lesson.files} removable />
          </div>
        )}
        <FilePicker files={files} onChange={setFiles} />
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

const DAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const pad = (n: number) => String(n).padStart(2, "0");

/** Semaines du mois (lundi en premier) ; null hors du mois. */
function monthWeeks(year: number, month: number): (string | null)[][] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: days }, (_, d) => `${year}-${pad(month + 1)}-${pad(d + 1)}`),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

function NoteCard({ n, staff, lessons }: { n: LessonNoteView; staff: boolean; lessons?: NoteLesson[] }) {
  const editable = lessons?.some((l) => l.id === n.lessonId);
  return (
    <li className="flex flex-col gap-2 rounded-card border border-line bg-surface px-[1.125rem] py-4">
      <div className="flex flex-wrap items-center gap-2">
        {n.subject && <SubjectChip name={n.subject.name} hue={n.subject.hue} />}
        {staff && <span className="text-meta text-ink-muted">{n.className}</span>}
        <span className="text-meta text-ink-muted">{formatTimeText(n.startsAt)}</span>
        {editable && (
          <span className="ml-auto">
            <LessonNoteEditor
              lessons={lessons!}
              initialLesson={n.lessonId}
              trigger={
                <Button variant="secondary" icon="attach_file" className="h-9 px-3 text-label">
                  Modifier / joindre
                </Button>
              }
            />
          </span>
        )}
      </div>
      <p className="m-0 text-ui break-words whitespace-pre-line">{n.content}</p>
      <AttachmentList files={n.files} />
    </li>
  );
}

/** Cahier de textes : calendrier du mois ; les jours qui ont un contenu de séance s'ouvrent d'un clic. */
export function SeancesCalendar({
  year,
  month,
  today,
  notes,
  homework = [],
  noteLessons,
  staff,
}: {
  year: number;
  month: number;
  today: string;
  notes: LessonNoteView[];
  /** Devoirs à rendre dans le mois (avec leurs pièces jointes). */
  homework?: HomeworkView[];
  /** Enseignant : ses cours, pour modifier un contenu et y joindre des fichiers depuis le calendrier. */
  noteLessons?: NoteLesson[];
  staff: boolean;
}) {
  const router = useRouter();
  const byDay = new Map<string, LessonNoteView[]>();
  for (const n of notes) {
    const d = isoDay(n.startsAt);
    byDay.set(d, [...(byDay.get(d) ?? []), n]);
  }
  const dueByDay = new Map<string, HomeworkView[]>();
  for (const h of homework) dueByDay.set(h.dueOn, [...(dueByDay.get(h.dueOn) ?? []), h]);
  const withNotes = [...new Set([...byDay.keys(), ...dueByDay.keys()])].sort();
  const has = (d: string) => byDay.has(d) || dueByDay.has(d);
  const initial = has(today) ? today : ([...withNotes].reverse().find((d) => d <= today) ?? withNotes[0] ?? null);
  const [selected, setSelected] = useState<string | null>(initial);
  const day = selected && has(selected) ? selected : initial;
  const title = formatMonth(year, month);
  const go = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    router.push(`/devoirs?mois=${d.getFullYear()}-${pad(d.getMonth() + 1)}`, { scroll: false });
  };

  return (
    <section aria-labelledby="seances" className="flex flex-col gap-3">
      <h2 id="seances" className="m-0 font-display text-h3 font-bold">
        Contenu des séances
      </h2>
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <b className="font-display text-card" aria-live="polite">
            {title}
          </b>
          <div className="flex gap-1.5">
            {[
              { d: -1, icon: "chevron_left" as const, label: "Mois précédent" },
              { d: 1, icon: "chevron_right" as const, label: "Mois suivant" },
            ].map((b) => (
              <button
                key={b.d}
                type="button"
                aria-label={b.label}
                onClick={() => go(b.d)}
                className="flex size-10 items-center justify-center rounded-[9px] border border-line hover:border-line-strong"
              >
                <Icon name={b.icon} />
              </button>
            ))}
          </div>
        </div>
        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">Séances de {title}</caption>
          <thead>
            <tr>
              {DAYS.map((d) => (
                <th key={d} scope="col" className="py-2 text-center text-meta font-normal text-ink-muted">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthWeeks(year, month).map((week, w) => (
              <tr key={w}>
                {week.map((d, i) => {
                  if (!d) return <td key={i} />;
                  const list = byDay.get(d) ?? [];
                  const due = dueByDay.get(d) ?? [];
                  const n = Number(d.slice(8));
                  const active = d === day;
                  const label = [
                    list.length ? `${list.length} séance${list.length > 1 ? "s" : ""}` : "",
                    due.length ? `${due.length} devoir${due.length > 1 ? "s" : ""} à rendre` : "",
                  ].filter(Boolean).join(", ");
                  return (
                    <td key={d} className="p-0.5 text-center align-top">
                      {list.length || due.length ? (
                        <button
                          type="button"
                          aria-pressed={active}
                          aria-label={`${formatDateLong(d)} : ${label}`}
                          onClick={() => setSelected(d)}
                          className={cn(
                            "mx-auto flex h-12 w-full max-w-14 flex-col items-center justify-center gap-1 rounded-control text-ui font-bold",
                            active ? "bg-brand text-on-brand" : "bg-surface-2 hover:bg-neutral-bg",
                            d === today && !active && "ring-2 ring-brand",
                          )}
                        >
                          {n}
                          <span className="flex gap-0.5" aria-hidden="true">
                            {list.slice(0, 4).map((x) => (
                              <span
                                key={x.lessonId}
                                className="size-1.5 rounded-full"
                                style={{ background: active ? "currentColor" : `oklch(0.65 0.13 ${x.subject?.hue ?? 0})` }}
                              />
                            ))}
                            {due.length > 0 && (
                              <span className={cn("size-1.5 rotate-45", active ? "bg-current" : "bg-ink-2")} title="Devoir à rendre" />
                            )}
                          </span>
                        </button>
                      ) : (
                        <span
                          className={cn(
                            "mx-auto flex h-12 w-full max-w-14 items-center justify-center rounded-control text-ui text-ink-muted",
                            d === today && "font-bold text-ink ring-2 ring-line-strong",
                          )}
                        >
                          {n}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {day ? (
        <div className="flex flex-col gap-2.5" aria-live="polite">
          <h3 className="m-0 text-ui font-bold">{formatDateLong(day, true)}</h3>
          {(byDay.get(day) ?? []).length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0" aria-label="Séances">
              {(byDay.get(day) ?? []).map((n) => (
                <NoteCard key={n.lessonId} n={n} staff={staff} lessons={noteLessons} />
              ))}
            </ul>
          )}
          {(dueByDay.get(day) ?? []).length > 0 && (
            <>
              <h4 className="m-0 mt-1 text-label font-bold text-ink-2">Travail à rendre ce jour</h4>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {(dueByDay.get(day) ?? []).map((h) => (
                  <li key={h.id} className="flex flex-col gap-2 rounded-card border border-line bg-surface px-[1.125rem] py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <SubjectChip name={h.subject.name} hue={h.subject.hue} />
                      {h.exam && <Badge tone="inverse" className="text-xs">Contrôle</Badge>}
                      {staff && h.className && <span className="text-meta text-ink-muted">{h.className}</span>}
                      <span className="text-meta text-ink-muted">Donné le {h.given}</span>
                    </div>
                    <p className="m-0 text-ui break-words whitespace-pre-line">{h.text}</p>
                    <AttachmentList files={h.files} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">
          Aucune séance ni aucun devoir en {title.toLowerCase()}.
        </p>
      )}
    </section>
  );
}
