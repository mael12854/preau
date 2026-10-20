"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  giveHomework,
  removeHomework,
  updateHomework,
} from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { HomeworkChoice } from "@/lib/data/homework";
import type { HomeworkView } from "@/lib/data/types";

/** Champs communs : travail, échéance, contrôle. */
function HomeworkFields({
  content,
  setContent,
  due,
  setDue,
  exam,
  setExam,
  min,
}: {
  content: string;
  setContent: (v: string) => void;
  due: string;
  setDue: (v: string) => void;
  exam: boolean;
  setExam: (v: boolean) => void;
  min: string;
}) {
  return (
    <>
      <TextAreaField
        label="Travail à faire"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={2000}
        rows={4}
        required
      />
      <TextField
        label="Pour le"
        type="date"
        min={min}
        value={due}
        onChange={(e) => setDue(e.target.value)}
        required
      />
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-label">
        <Checkbox checked={exam} onCheckedChange={setExam} />
        C&apos;est un contrôle (annoncé aux élèves et aux familles)
      </label>
    </>
  );
}

/** Donner un devoir à une classe (enseignant). Date proposée : le prochain cours de la matière. */
export function GiveHomework({
  choices,
  today,
}: {
  choices: HomeworkChoice[];
  today: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(
    choices[0] ? `${choices[0].classId}|${choices[0].subjectId}` : "",
  );
  const choice = choices.find((c) => `${c.classId}|${c.subjectId}` === key);
  const [content, setContent] = useState("");
  const [due, setDue] = useState(choices[0]?.next ?? "");
  const [exam, setExam] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!choices.length)
    return (
      <p className="m-0 text-label text-ink-2">
        Vous pourrez donner des devoirs dès que vous aurez des cours à
        l&apos;emploi du temps.
      </p>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Donner un devoir"
      description="Les élèves de la classe et leurs familles le voient dans leurs devoirs."
      trigger={
        <Button icon="add" className="h-10 px-4 text-label">
          Donner un devoir
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!choice) return;
          if (!content.trim()) return setError("Décrivez le travail à faire.");
          if (!due || due < today) return setError("Choisissez une date à venir.");
          setError(null);
          start(async () => {
            const r = await giveHomework({
              classId: choice.classId,
              subjectId: choice.subjectId,
              content: content.trim(),
              due,
              exam,
            });
            if (!r.ok) return setError(r.error ?? "");
            toast({ title: exam ? "Contrôle annoncé" : "Devoir donné" });
            setOpen(false);
            setContent("");
            setExam(false);
            router.refresh();
          });
        }}
      >
        <SelectField
          label="Classe et matière"
          options={choices.map((c) => ({
            value: `${c.classId}|${c.subjectId}`,
            label: c.label,
          }))}
          value={key}
          onValueChange={(v) => {
            setKey(v);
            const c = choices.find((x) => `${x.classId}|${x.subjectId}` === v);
            if (c?.next) setDue(c.next);
          }}
        />
        <HomeworkFields
          content={content}
          setContent={setContent}
          due={due}
          setDue={setDue}
          exam={exam}
          setExam={setExam}
          min={today}
        />
        {error && (
          <p role="alert" className="m-0 text-label text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 px-4 text-label">
            {pending ? "Envoi…" : exam ? "Annoncer le contrôle" : "Donner le devoir"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Modifier ou retirer un devoir qu'on a donné. */
export function HomeworkActions({
  item,
  today,
}: {
  item: HomeworkView;
  today: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(item.text);
  const [due, setDue] = useState(item.dueOn);
  const [exam, setExam] = useState(item.exam);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex gap-2">
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`Modifier le devoir · ${item.subject.name}`}
        trigger={
          <Button variant="secondary" className="h-9 px-3 text-label">
            Modifier
          </Button>
        }
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!content.trim()) return setError("Décrivez le travail à faire.");
            setError(null);
            start(async () => {
              const r = await updateHomework(item.id, {
                content: content.trim(),
                due,
                exam,
              });
              if (!r.ok) return setError(r.error ?? "");
              toast({ title: "Devoir modifié" });
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <HomeworkFields
            content={content}
            setContent={setContent}
            due={due}
            setDue={setDue}
            exam={exam}
            setExam={setExam}
            min={today}
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
      <Button
        variant="secondary"
        disabled={pending}
        className="h-9 px-3 text-label"
        onClick={() => {
          if (!window.confirm(`Retirer ce devoir de ${item.subject.name} ?`)) return;
          start(async () => {
            const r = await removeHomework(item.id);
            toast({ title: r.ok ? "Devoir retiré" : (r.error ?? "") });
            if (r.ok) router.refresh();
          });
        }}
      >
        Retirer
      </Button>
    </div>
  );
}
