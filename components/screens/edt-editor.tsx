"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createLessonSeries,
  deleteLesson,
  deleteLessonSeries,
  setLessonCancelled,
  setLessonGroup,
  updateLesson,
} from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { SelectField, TextField } from "@/components/ui/field";
import { setActAs } from "@/components/shell/act-as";
import { useToast } from "@/components/ui/toast";
import type { LessonView } from "@/lib/data/types";
import { formatTimeGrid } from "@/lib/format";

type Option = { id: string; name: string };
const WHOLE = "classe";
/** Choix « Pour » : classe entière ou un groupe (G1, Espagnol…). */
const groupOptions = (groups: Option[]) => [
  { value: WHOLE, label: "Toute la classe" },
  ...groups.map((g) => ({ value: g.id, label: g.name })),
];
type Recurrence = "weekly" | "week_a" | "week_b" | "monthly" | "daily";
const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: "weekly", label: "Chaque semaine, ce jour-là" },
  { value: "week_a", label: "Semaine A seulement" },
  { value: "week_b", label: "Semaine B seulement" },
  { value: "monthly", label: "Tous les mois" },
  { value: "daily", label: "Tous les jours" },
];
const NTH = [
  { value: "1", label: "Le 1er" },
  { value: "2", label: "Le 2e" },
  { value: "3", label: "Le 3e" },
  { value: "4", label: "Le 4e" },
  { value: "5", label: "Le dernier" },
];
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
  groups = [],
}: {
  /** Primaire : nom du titulaire, qui fait tous les cours de la classe (nul hors primaire). */
  titular: string | null;
  /** Groupes de la classe, libellés « G1 (Demi-groupe) ». */
  groups?: Option[];
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
  const [recurrence, setRecurrence] = useState<Recurrence>("weekly");
  const [nth, setNth] = useState("1");
  const [starts, setStarts] = useState("09:00");
  const [ends, setEnds] = useState("10:00");
  const [groupId, setGroupId] = useState(WHOLE);
  // Période : d'aujourd'hui à la fin de l'année scolaire.
  const from = defaultFrom;
  const until = defaultUntil;
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
    setError(null);
    start(async () => {
      const r = await createLessonSeries({
        classId,
        subjectId,
        teacherId,
        room: room.trim(),
        weekday: Number(weekday),
        recurrence,
        nth: recurrence === "monthly" ? Number(nth) : null,
        starts,
        ends,
        from,
        until,
        groupId: groupId === WHOLE ? null : groupId,
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
      description="Le cours est créé d'aujourd'hui à la fin de l'année scolaire, selon la récurrence choisie, sauf pendant les vacances indiquées dans l'agenda."
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
        {groups.length > 0 && (
          <SelectField
            label="Pour"
            options={groupOptions(groups)}
            value={groupId}
            onValueChange={setGroupId}
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
          label="Récurrence"
          options={RECURRENCES}
          value={recurrence}
          onValueChange={(v) => setRecurrence(v as Recurrence)}
        />
        {recurrence !== "daily" && (
          <div
            className={
              recurrence === "monthly" ? "grid gap-4 sm:grid-cols-2" : undefined
            }
          >
            {recurrence === "monthly" && (
              <SelectField
                label="Quel jour du mois"
                options={NTH}
                value={nth}
                onValueChange={setNth}
              />
            )}
            <SelectField
              label="Jour"
              options={WEEKDAYS.map((d, i) => ({
                value: String(i + 1),
                label: d,
              }))}
              value={weekday}
              onValueChange={setWeekday}
            />
          </div>
        )}
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
  mine,
}: {
  lessons: LessonView[];
  days: string[];
  /** Dates ISO des 7 jours de la semaine (lundi → dimanche). */
  dates: string[];
  canManage: boolean;
  me: string;
  /** Espace « Général » : toutes les fiches d'enseignant du compte. */
  mine?: string[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const own = mine ?? [me];
  const list = lessons.filter((l) => canManage || own.includes(l.teacherId));
  if (!list.length) return null;
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
        {list.map((l) => {
          const day = days[l.day];
          const dayIso = dates[l.day];
          return (
            <li
              key={l.id}
              onPointerDownCapture={() => setActAs(l.teacherId)}
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
                  · {l.className}
                  {l.group ? ` (${l.group})` : ""} · {l.teacher} · {l.room}
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

export type LessonEditOptions = {
  /** « manage » : secrétariat (tout modifier) ; « teacher » : l'enseignant annule ou rétablit ses cours. */
  mode: "manage" | "teacher";
  me: string;
  /** Espace « Général » : toutes les fiches d'enseignant du compte (cours cliquables de chaque école). */
  mine?: string[];
  subjects: Option[];
  teachers: Option[];
  /** Primaire : nom du titulaire (l'enseignant ne se choisit pas) ; nul sinon. */
  titular: string | null;
  /** Dates ISO des 7 jours de la semaine affichée. */
  dates: string[];
  /** Groupes de la classe affichée (secrétariat). */
  groups?: Option[];
};

/** Fenêtre d'un cours : modifier (ce cours ou les suivants), annuler / rétablir, supprimer. */
export function LessonDialog({
  lesson,
  options,
  onClose,
}: {
  lesson: LessonView;
  options: LessonEditOptions;
  onClose: () => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const manage = options.mode === "manage";
  const [subjectId, setSubjectId] = useState(lesson.subject.id);
  const [teacherId, setTeacherId] = useState(lesson.teacherId);
  const [room, setRoom] = useState(lesson.room);
  const [day, setDay] = useState(options.dates[lesson.day] ?? "");
  const [starts, setStarts] = useState(formatTimeGrid(lesson.start));
  const [ends, setEnds] = useState(formatTimeGrid(lesson.end));
  const [scope, setScope] = useState<"one" | "following">("one");
  const [groupId, setGroupId] = useState(lesson.groupId ?? WHOLE);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const label = `${lesson.subject.name} · ${lesson.className ?? ""}${lesson.group ? ` (${lesson.group})` : ""}`;
  const groups = options.groups ?? [];

  const done = (r: { ok: boolean; error?: string }, ok: string) => {
    if (!r.ok) return setError(r.error ?? "");
    toast({ title: ok });
    onClose();
    router.refresh();
  };

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={label}
      description={`${WEEKDAYS[lesson.day]} ${options.dates[lesson.day] ? options.dates[lesson.day].split("-").reverse().join("/") : ""} · ${formatTimeGrid(lesson.start)}–${formatTimeGrid(lesson.end)} · ${lesson.teacher}`}
    >
      {(options.mine ?? [options.me]).includes(lesson.teacherId) && !lesson.cancelled && (
        <Link
          href={`/appel?cours=${lesson.id}`}
          className="inline-flex h-11 w-fit items-center gap-2 rounded-control bg-brand px-4 text-label font-bold text-on-brand hover:opacity-90"
        >
          <Icon name="fact_check" size={20} />
          Faire l&apos;appel de ce cours
        </Link>
      )}
      {manage ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!room.trim()) return setError("Indiquez une salle.");
            if (ends <= starts)
              return setError("L'heure de fin doit suivre l'heure de début.");
            setError(null);
            start(async () => {
              const r = await updateLesson(lesson.id, {
                subjectId,
                teacherId,
                room: room.trim(),
                day,
                starts,
                ends,
                scope,
              });
              const g = (lesson.groupId ?? WHOLE) !== groupId;
              done(
                r.ok && g
                  ? await setLessonGroup(
                      lesson.id,
                      groupId === WHOLE ? null : groupId,
                      scope,
                    )
                  : r,
                scope === "following"
                  ? "Cours et suivants modifiés"
                  : "Cours modifié",
              );
            });
          }}
        >
          <SelectField
            label="Matière"
            options={options.subjects.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
            value={subjectId}
            onValueChange={setSubjectId}
          />
          {options.titular !== null ? (
            <p className="m-0 text-label text-ink-2">
              Enseignant : <b>{options.titular}</b>, titulaire de la classe.
            </p>
          ) : (
            <SelectField
              label="Enseignant"
              options={options.teachers.map((t) => ({
                value: t.id,
                label: t.name,
              }))}
              value={teacherId}
              onValueChange={setTeacherId}
            />
          )}
          {(groups.length > 0 || lesson.groupId) && (
            <SelectField
              label="Pour"
              options={groupOptions(
                groups.length
                  ? groups
                  : [{ id: lesson.groupId!, name: lesson.group ?? "" }],
              )}
              value={groupId}
              onValueChange={setGroupId}
            />
          )}
          <TextField
            label="Salle"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            maxLength={40}
            required
          />
          {lesson.seriesId && (
            <SelectField
              label="Appliquer à"
              options={[
                { value: "one", label: "Ce cours seulement" },
                { value: "following", label: "Ce cours et les suivants" },
              ]}
              value={scope}
              onValueChange={(v) => setScope(v as "one" | "following")}
            />
          )}
          {(scope === "one" || !lesson.seriesId) && (
            <TextField
              label="Date"
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              required
            />
          )}
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
          {error && (
            <p role="alert" className="m-0 text-label text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-between gap-2 border-t border-line-soft pt-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                className="h-10 px-3.5 text-label"
                onClick={() =>
                  start(async () =>
                    done(
                      await setLessonCancelled(lesson.id, !lesson.cancelled),
                      lesson.cancelled ? "Cours rétabli" : "Cours annulé",
                    ),
                  )
                }
              >
                {lesson.cancelled ? "Rétablir" : "Annuler le cours"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                className="h-10 px-3.5 text-label"
                onClick={() => {
                  if (
                    !window.confirm(
                      `Supprimer ce cours de ${lesson.subject.name} ?`,
                    )
                  )
                    return;
                  start(async () =>
                    done(await deleteLesson(lesson.id), "Cours supprimé"),
                  );
                }}
              >
                Supprimer ce cours
              </Button>
              {lesson.seriesId && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  className="h-10 px-3.5 text-label"
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Supprimer ce cours de ${lesson.subject.name} et tous les suivants de la série ? Les cours déjà appelés restent.`,
                      )
                    )
                      return;
                    start(async () =>
                      done(
                        await deleteLessonSeries(
                          lesson.seriesId!,
                          options.dates[lesson.day],
                        ),
                        "Cours et suivants supprimés",
                      ),
                    );
                  }}
                >
                  Supprimer avec les suivants
                </Button>
              )}
            </div>
            <Button
              type="submit"
              disabled={pending}
              className="h-10 px-4 text-label"
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="m-0 text-label text-ink-2">
            Salle {lesson.room}. Pour changer l&apos;horaire ou la salle,
            adressez-vous au secrétariat.
          </p>
          {error && (
            <p role="alert" className="m-0 text-label text-danger">
              {error}
            </p>
          )}
          {(options.mine ?? [options.me]).includes(lesson.teacherId) && (
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={pending}
                className="h-10 px-4 text-label"
                onClick={() =>
                  start(async () =>
                    done(
                      await setLessonCancelled(lesson.id, !lesson.cancelled),
                      lesson.cancelled ? "Cours rétabli" : "Cours annulé",
                    ),
                  )
                }
              >
                {lesson.cancelled ? "Rétablir le cours" : "Annuler le cours"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
