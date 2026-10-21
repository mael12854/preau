"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAssessment, deleteAssessment, updateAssessment } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { HomeworkChoice } from "@/lib/data/homework";
import type { Grading } from "@/lib/grading";

const TERMS = [
  { value: "1", label: "Trimestre 1" },
  { value: "2", label: "Trimestre 2" },
  { value: "3", label: "Trimestre 3" },
];

/** Trimestre d'une date : septembre–décembre, janvier–mars, avril–août. */
const termOf = (day: string) => {
  const m = Number(day.slice(5, 7));
  return m >= 9 ? 1 : m <= 3 ? 2 : 3;
};

/** Créer une évaluation (professeur) : classe et matière, titre, date, trimestre, compétences évaluées. */
export function NewAssessment({ choices, today, grading }: { choices: HomeworkChoice[]; today: string; grading: Grading }) {
  const toast = useToast();
  const router = useRouter();
  const path = usePathname();
  const competences = grading !== "note20";
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(choices[0] ? `${choices[0].classId}|${choices[0].subjectId}` : "");
  const [title, setTitle] = useState("");
  const [heldOn, setHeldOn] = useState(today);
  const [term, setTerm] = useState(String(termOf(today)));
  const [skills, setSkills] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const choice = choices.find((c) => `${c.classId}|${c.subjectId}` === key);

  if (!choices.length) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Nouvelle évaluation"
      description={
        competences
          ? "Vous positionnerez ensuite chaque élève sur chaque compétence, puis vous publierez."
          : "Vous saisirez ensuite la note sur 20 de chaque élève, puis vous publierez."
      }
      trigger={
        <Button icon="add" className="h-10 px-4 text-label">
          Nouvelle évaluation
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!choice) return;
          const list = skills.split("\n").map((s) => s.trim()).filter(Boolean);
          if (!title.trim()) return setError("Donnez un titre à l'évaluation.");
          if (!heldOn) return setError("Indiquez la date de l'évaluation.");
          if (competences && list.length === 0) return setError("Ajoutez au moins une compétence évaluée.");
          setError(null);
          start(async () => {
            const r = await createAssessment({
              classId: choice.classId,
              subjectId: choice.subjectId,
              title: title.trim(),
              heldOn,
              term: Number(term),
              skills: competences ? list : [],
            });
            if (!r.ok) return setError(r.error ?? "");
            toast({ title: "Évaluation créée" });
            setOpen(false);
            setTitle("");
            setSkills("");
            router.push(`${path}?evaluation=${r.id}`);
            router.refresh();
          });
        }}
      >
        <SelectField
          label="Classe et matière"
          options={choices.map((c) => ({ value: `${c.classId}|${c.subjectId}`, label: c.label }))}
          value={key}
          onValueChange={setKey}
        />
        <TextField label="Titre" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Date"
            type="date"
            value={heldOn}
            onChange={(e) => {
              setHeldOn(e.target.value);
              if (e.target.value) setTerm(String(termOf(e.target.value)));
            }}
            required
          />
          <SelectField label="Période" options={TERMS} value={term} onValueChange={setTerm} />
        </div>
        {competences && (
          <TextAreaField
            label="Compétences évaluées"
            hint="Une par ligne, 12 au plus."
            value={skills}
            rows={4}
            maxLength={1200}
            onChange={(e) => setSkills(e.target.value)}
          />
        )}
        {error && (
          <p role="alert" className="m-0 text-label text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 px-4 text-label">
            {pending ? "Création…" : "Créer l'évaluation"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Choisir l'évaluation à saisir parmi celles du professeur. */
export function AssessmentPicker({ options, value }: { options: { id: string; label: string }[]; value: string | null }) {
  const router = useRouter();
  const path = usePathname();
  if (options.length < 2 || !value) return null;
  return (
    <SelectField
      label="Évaluation"
      options={options.map((o) => ({ value: o.id, label: o.label }))}
      value={value}
      onValueChange={(v) => router.push(`${path}?evaluation=${v}`)}
      className="min-w-0 flex-1 sm:max-w-md"
    />
  );
}

/** Supprimer l'évaluation affichée, après confirmation. */
export function DeleteAssessment({ id, title }: { id: string; title: string }) {
  const toast = useToast();
  const router = useRouter();
  const path = usePathname();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      icon="delete"
      disabled={pending}
      className="h-10 px-4 text-label"
      onClick={() => {
        if (!window.confirm(`Supprimer l'évaluation « ${title} » ? Les résultats saisis seront perdus, y compris pour les élèves et les familles si elle est publiée.`))
          return;
        start(async () => {
          const r = await deleteAssessment(id);
          toast({ title: r.ok ? "Évaluation supprimée" : r.error });
          if (r.ok) {
            router.push(path);
            router.refresh();
          }
        });
      }}
    >
      {pending ? "Suppression…" : "Supprimer"}
    </Button>
  );
}

/** Modifier l'évaluation affichée : titre, date, période, compétences (les pastilles suivent leur compétence). */
export function EditAssessment({
  assessment,
  grading,
}: {
  assessment: { id: string; title: string; heldOn: string; term: number; skills: string[] };
  grading: Grading;
}) {
  const toast = useToast();
  const router = useRouter();
  const competences = grading !== "note20";
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(assessment.title);
  const [heldOn, setHeldOn] = useState(assessment.heldOn);
  const [term, setTerm] = useState(String(assessment.term));
  const [skills, setSkills] = useState(assessment.skills.join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setTitle(assessment.title);
          setHeldOn(assessment.heldOn);
          setTerm(String(assessment.term));
          setSkills(assessment.skills.join("\n"));
          setError(null);
        }
      }}
      title="Modifier l'évaluation"
      description={
        competences
          ? "Les pastilles déjà saisies restent attachées à leur compétence. Une compétence retirée perd ses pastilles."
          : undefined
      }
      trigger={
        <Button type="button" variant="secondary" icon="edit" className="h-10 px-4 text-label">
          Modifier
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const list = skills.split("\n").map((s) => s.trim()).filter(Boolean);
          if (!title.trim()) return setError("Donnez un titre à l'évaluation.");
          if (!heldOn) return setError("Indiquez la date de l'évaluation.");
          if (competences && list.length === 0) return setError("Ajoutez au moins une compétence évaluée.");
          const removed = assessment.skills.filter((s) => !list.includes(s));
          if (
            competences &&
            removed.length &&
            !window.confirm(`Retirer ${removed.map((s) => `« ${s} »`).join(", ")} ? Les pastilles de ${removed.length > 1 ? "ces compétences" : "cette compétence"} seront perdues.`)
          )
            return;
          setError(null);
          start(async () => {
            const r = await updateAssessment({
              id: assessment.id,
              title: title.trim(),
              heldOn,
              term: Number(term),
              skills: competences ? list : [],
            });
            if (!r.ok) return setError(r.error ?? "");
            toast({ title: "Évaluation modifiée" });
            setOpen(false);
            router.refresh();
          });
        }}
      >
        <TextField label="Titre" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Date" type="date" value={heldOn} onChange={(e) => setHeldOn(e.target.value)} required />
          <SelectField label="Période" options={TERMS} value={term} onValueChange={setTerm} />
        </div>
        {competences && (
          <TextAreaField
            label="Compétences évaluées"
            hint="Une par ligne, 12 au plus."
            value={skills}
            rows={4}
            maxLength={1200}
            onChange={(e) => setSkills(e.target.value)}
          />
        )}
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
