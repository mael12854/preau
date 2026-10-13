"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createLessonSeries,
  deleteLessonSeries,
  setLessonCancelled,
} from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { LessonView } from "@/lib/data/types";
import { formatTimeGrid } from "@/lib/format";

type Option = { id: string; name: string };
const WEEKDAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

/** Ajouter un cours chaque semaine sur une période (direction, secrétariat). */
export function AddLessonSeries({
  classId,
  className,
  subjects,
  teachers,
  defaultFrom,
  defaultUntil,
  titular,
}: {
  /** Primaire : nom du titulaire, qui fait tous les cours de la classe (nul hors primaire). */
  titular: string | null;
  classId: string;
  className: string;
  subjects: Option[];
  teachers: Option[];
  defaultFrom: string;
  defaultUntil: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [room, setRoom] = useState("");
  const [weekday, setWeekday] = useState("1");
  const [starts, setStarts] = useState("09:00");
  const [ends, setEnds] = useState("10:00");
  const [from, setFrom] = useState(defaultFrom);
  const [until, setUntil] = useState(defaultUntil);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (titular === "")
    return (
      <p className="m-0 text-label text-ink-2">
        Cette classe n&apos;a pas encore de titulaire : confiez-la à un
        enseignant dans l&apos;Annuaire.
      </p>
    );
  if (!teachers.length && titular === null)
    return (
      <p className="m-0 text-label text-ink-2">
        Ajoutez d&apos;abord un enseignant dans l&apos;Annuaire pour construire
        l&apos;emploi du temps.
      </p>
    );

  const submit = () => {
    if (!room.trim()) return setError("Indiquez une salle.");
    if (ends <= starts)
      return setError("L'heure de fin doit suivre l'heure de début.");
    if (until < from)
      return setError("La fin de la période précède son début.");
    setError(null);
    start(async () => {
      const r = await createLessonSeries({
        classId,
        subjectId,
        teacherId,
        room: room.trim(),
        weekday: Number(weekday),
        starts,
        ends,
        from,
        until,
      });
      if (!r.ok) return setError(r.error);
      toast({
        title: r.count
          ? `${r.count} cours ajoutés à l'emploi du temps de ${className}`
          : "Aucun cours créé : vérifiez le jour et la période.",
      });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={`Ajouter un cours · ${className}`}
      description="Le cours est créé chaque semaine sur la période, sauf pendant les vacances indiquées dans l'agenda."
      trigger={
        <Button icon="add" className="h-10 px-4 text-label">
          Ajouter un cours
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <SelectField
          label="Matière"
          options={subjects.map((s) => ({ value: s.id, label: s.name }))}
          value={subjectId}
          onValueChange={setSubjectId}
        />
        {titular !== null ? (
          <p className="m-0 text-label text-ink-2">
            Enseignant : <b>{titular}</b>, titulaire de la classe.
          </p>
        ) : (
          <SelectField
            label="Enseignant"
            options={teachers.map((t) => ({ value: t.id, label: t.name }))}
            value={teacherId}
            onValueChange={setTeacherId}
          />
        )}
        <TextField
          label="Salle"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          maxLength={40}
          required
        />
        <SelectField
          label="Jour"
          options={WEEKDAYS.map((d, i) => ({ value: String(i + 1), label: d }))}
          value={weekday}
          onValueChange={setWeekday}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Début"
            type="time"
            value={starts}
            onChange={(e) => setStarts(e.target.value)}
            required
          />
          <TextField
            label="Fin"
            type="time"
            value={ends}
            onChange={(e) => setEnds(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="À partir du"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
          />
          <TextField
            label="Jusqu'au"
            type="date"
            value={until}
            min={from}
            onChange={(e) => setUntil(e.target.value)}
            required
          />
        </div>
        {error && (
          <p role="alert" className="m-0 text-label text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={pending}
            className="h-10 px-4 text-label"
          >
            {pending ? "Création…" : "Créer les cours"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Cours de la semaine : annuler, rétablir, retirer la série (selon les droits). */
export function WeekLessonList({
  lessons,
  days,
  dates,
  canManage,
  me,
}: {
  lessons: LessonView[];
  days: string[];
  /** Dates ISO des 7 jours de la semaine (lundi → dimanche). */
  dates: string[];
  canManage: boolean;
  me: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const mine = lessons.filter((l) => canManage || l.teacherId === me);
  if (!mine.length) return null;
  const act = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    ok: string,
  ) =>
    start(async () => {
      const r = await fn();
      toast({ title: r.ok ? ok : (r.error ?? "") });
      if (r.ok) router.refresh();
    });

  return (
    <section
      aria-labelledby="edt-cours"
      className="rounded-card border border-line bg-surface"
    >
      <h2
        id="edt-cours"
        className="m-0 border-b border-line px-5 py-3.5 font-display text-card font-bold"
      >
        Cours de la semaine
      </h2>
      <ul className="m-0 list-none p-0">
        {mine.map((l) => {
          const day = days[l.day];
          const dayIso = dates[l.day];
          return (
            <li
              key={l.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line-soft px-5 py-2.5 last:border-b-0"
            >
              <span className="tabular w-36 text-caption text-ink-muted">
                {day} · {formatTimeGrid(l.start)}–{formatTimeGrid(l.end)}
              </span>
              <b
                className={
                  l.cancelled
                    ? "flex-1 text-label line-through"
                    : "flex-1 text-label"
                }
              >
                {l.subject.name}
                <span className="font-normal text-ink-muted">
                  {" "}
                  · {l.className} · {l.teacher} · {l.room}
                </span>
              </b>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                className="h-9 px-3 text-label"
                onClick={() =>
                  act(
                    () => setLessonCancelled(l.id, !l.cancelled),
                    l.cancelled ? "Cours rétabli" : "Cours annulé",
                  )
                }
              >
                {l.cancelled ? "Rétablir" : "Annuler"}
              </Button>
              {canManage && l.seriesId && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  className="h-9 px-3 text-label"
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Retirer ce cours de ${l.subject.name} chaque semaine à partir du ${day} ? Les cours déjà appelés restent.`,
                      )
                    )
                      return;
                    act(
                      () => deleteLessonSeries(l.seriesId!, dayIso),
                      "Série retirée de l'emploi du temps",
                    );
                  }}
                >
                  Retirer la série
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
