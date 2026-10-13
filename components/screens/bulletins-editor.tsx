"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteReportCard,
  deleteReportCards,
  prepareReportCards,
  saveReportCouncil,
  saveReportLine,
} from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { ReportEditorView } from "@/lib/data/report-editor";
import {
  EVAL_LEVELS,
  evalText,
  type EvalLevel,
  type EvalScale,
} from "@/lib/evaluation";
import { formatDateShort } from "@/lib/format";
import type { Grading } from "@/lib/grading";

type Student = ReportEditorView["students"][number];
const TERMS = [
  { value: "1", label: "Trimestre 1" },
  { value: "2", label: "Trimestre 2" },
  { value: "3", label: "Trimestre 3" },
];

/** Bulletin d'un élève : une ligne par matière modifiable, et l'avis du conseil pour la direction. */
function StudentReport({
  student,
  view,
  scale,
  grading,
}: {
  student: Student;
  view: ReportEditorView;
  scale: EvalScale;
  grading: Grading;
}) {
  const toast = useToast();
  const router = useRouter();
  const [lines, setLines] = useState(student.lines);
  const [council, setCouncil] = useState(student.council);
  const [pending, start] = useTransition();
  const positioning = grading !== "note20";
  const card = student.reportCardId;

  const save = () =>
    start(async () => {
      if (!card) return;
      for (const s of view.subjects) {
        const now = lines[s.id] ?? { level: null, comment: "" };
        const before = student.lines[s.id] ?? { level: null, comment: "" };
        if (
          now.level === before.level &&
          now.comment.trim() === before.comment.trim()
        )
          continue;
        const r = await saveReportLine(
          card,
          s.id,
          positioning ? now.level : null,
          now.comment,
        );
        if (!r.ok) return toast({ title: `${s.name} : ${r.error}` });
      }
      if (
        view.canCouncil &&
        (council.mention !== student.council.mention ||
          council.text !== student.council.text)
      ) {
        const r = await saveReportCouncil(card, council.mention, council.text);
        if (!r.ok) return toast({ title: r.error });
      }
      toast({ title: `Bulletin de ${student.name} enregistré` });
      router.refresh();
    });

  return (
    <details className="group rounded-card border border-line bg-surface open:shadow-sm">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3">
        <b className="text-ui">{student.name}</b>
        <span className="flex items-center gap-2 text-caption text-ink-muted">
          {card ? (
            <>
              {Object.keys(student.lines).length}/{view.subjects.length} matière
              {view.subjects.length > 1 ? "s" : ""} remplie
              {view.subjects.length > 1 ? "s" : ""}
              {student.publishOn &&
                ` · publication le ${formatDateShort(student.publishOn)}`}
            </>
          ) : (
            <Badge tone="neutral">Bulletin non préparé</Badge>
          )}
        </span>
      </summary>
      {card && (
        <form
          className="flex flex-col gap-5 border-t border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {view.subjects.length === 0 && (
            <p className="m-0 text-ui text-ink-2">
              Aucune matière à remplir pour vous dans cette classe.
            </p>
          )}
          {view.subjects.map((s) => {
            const line = lines[s.id] ?? { level: null, comment: "" };
            const set = (patch: Partial<typeof line>) =>
              setLines((l) => ({ ...l, [s.id]: { ...line, ...patch } }));
            return (
              <fieldset
                key={s.id}
                className="m-0 flex flex-col gap-2.5 border-0 p-0"
              >
                <legend className="mb-1 font-display text-ui font-bold">
                  {s.name}
                </legend>
                {positioning && (
                  <SelectField
                    label="Positionnement"
                    options={[
                      { value: "aucun", label: "Non positionné" },
                      ...EVAL_LEVELS.map((l) => ({
                        value: l,
                        label: evalText(l, scale).label,
                      })),
                    ]}
                    value={line.level ?? "aucun"}
                    onValueChange={(v) =>
                      set({ level: v === "aucun" ? null : (v as EvalLevel) })
                    }
                  />
                )}
                <TextAreaField
                  label="Appréciation"
                  hint="Laisser vide retire la matière du bulletin."
                  value={line.comment}
                  maxLength={1000}
                  onChange={(e) => set({ comment: e.target.value })}
                />
              </fieldset>
            );
          })}
          {view.canCouncil && (
            <fieldset className="m-0 flex flex-col gap-2.5 border-0 border-t border-line-soft p-0 pt-4">
              <legend className="mb-1 font-display text-ui font-bold">
                Avis du conseil de classe
              </legend>
              <TextField
                label="Mention (facultative)"
                value={council.mention}
                maxLength={80}
                onChange={(e) =>
                  setCouncil((c) => ({ ...c, mention: e.target.value }))
                }
              />
              <TextAreaField
                label="Avis"
                value={council.text}
                maxLength={1000}
                onChange={(e) =>
                  setCouncil((c) => ({ ...c, text: e.target.value }))
                }
              />
            </fieldset>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            {view.canPrepare && (
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                className="h-10 px-4 text-label"
                onClick={() => {
                  if (
                    !window.confirm(
                      `Supprimer le bulletin de ${student.name} ? Ses appréciations et l'avis du conseil seront perdus.`,
                    )
                  )
                    return;
                  start(async () => {
                    const r = await deleteReportCard(card);
                    toast({
                      title: r.ok
                        ? `Bulletin de ${student.name} supprimé`
                        : r.error,
                    });
                    if (r.ok) router.refresh();
                  });
                }}
              >
                Supprimer le bulletin
              </Button>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="h-10 px-4 text-label"
            >
              {pending ? "Enregistrement…" : "Enregistrer le bulletin"}
            </Button>
          </div>
        </form>
      )}
    </details>
  );
}

/** Saisie des bulletins (personnel) : classe, trimestre, préparation, puis une fiche par élève. */
export function BulletinsEditor({
  view,
  scale,
  grading,
  today,
}: {
  view: ReportEditorView;
  scale: EvalScale;
  grading: Grading;
  today: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [publishOn, setPublishOn] = useState(today);
  const [pending, start] = useTransition();
  const go = (classId: string | null, term: number) =>
    router.push(`/bulletins?classe=${classId ?? ""}&trimestre=${term}`);

  if (view.classes.length === 0)
    return (
      <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
        Aucune classe pour l&apos;instant.
      </p>
    );

  const missing = view.students.filter((s) => !s.reportCardId).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <SelectField
          label="Classe"
          options={view.classes.map((c) => ({ value: c.id, label: c.name }))}
          value={view.classId ?? undefined}
          onValueChange={(v) => go(v, view.term)}
          className="min-w-44"
        />
        <SelectField
          label="Période"
          options={TERMS}
          value={String(view.term)}
          onValueChange={(v) => go(view.classId, Number(v))}
          className="min-w-44"
        />
      </div>

      {view.canPrepare && view.classId && view.students.length > 0 && (
        <form
          className="flex flex-wrap items-end gap-4 rounded-card border border-line bg-surface px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await prepareReportCards(
                view.classId!,
                view.term,
                publishOn,
              );
              toast({
                title: r.ok ? "Bulletins préparés pour la classe" : r.error,
              });
              if (r.ok) router.refresh();
            });
          }}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <b className="text-ui">
              {missing
                ? `${missing} bulletin${missing > 1 ? "s" : ""} à préparer`
                : "Bulletins préparés"}
            </b>
            <span className="text-caption text-ink-muted">
              Les familles voient le contenu à partir de la date de publication.
            </span>
          </div>
          <TextField
            label="Publication le"
            type="date"
            value={publishOn}
            onChange={(e) => setPublishOn(e.target.value)}
            required
          />
          <Button
            type="submit"
            disabled={pending}
            className="h-12 px-4 text-label"
          >
            {missing ? "Préparer les bulletins" : "Changer la date"}
          </Button>
          {missing < view.students.length && (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              className="h-12 px-4 text-label"
              onClick={() => {
                if (
                  !window.confirm(
                    "Supprimer tous les bulletins de cette classe pour ce trimestre ? Les appréciations et les avis du conseil seront perdus.",
                  )
                )
                  return;
                start(async () => {
                  const r = await deleteReportCards(view.classId!, view.term);
                  toast({
                    title: r.ok ? "Bulletins de la classe supprimés" : r.error,
                  });
                  if (r.ok) router.refresh();
                });
              }}
            >
              Supprimer les bulletins
            </Button>
          )}
        </form>
      )}

      {view.students.length === 0 ? (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
          Aucun élève dans cette classe.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {!view.canPrepare && missing === view.students.length && (
            <p className="m-0 text-label text-ink-2">
              La direction ou le secrétariat doit d&apos;abord préparer les
              bulletins de cette classe.
            </p>
          )}
          {view.students.map((s) => (
            <StudentReport
              key={`${s.id}-${view.term}-${s.reportCardId}`}
              student={s}
              view={view}
              scale={scale}
              grading={grading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
