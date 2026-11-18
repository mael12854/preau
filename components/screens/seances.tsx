"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveLessonNote } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { SubjectChip } from "@/components/ui/subject-chip";
import { useToast } from "@/components/ui/toast";
import type { NoteLesson } from "@/lib/data/homework";
import type { LessonNoteView } from "@/lib/data/types";
import { formatDateLong, formatTimeText } from "@/lib/format";
import { AttachmentList, FilePicker, uploadAttachments } from "./attachments";

const when = (startsAt: string) => `${formatDateLong(startsAt, true)} · ${formatTimeText(startsAt)}`;

/** Contenu de séance : l'enseignant choisit un de ses cours (3 semaines passées, 1 à venir), écrit ce qui a été fait, joint des fichiers. */
export function LessonNoteEditor({ lessons, initialLesson }: { lessons: NoteLesson[]; initialLesson?: string }) {
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
        <Button variant="secondary" icon="edit_note" className="h-10 px-4 text-label">
          Contenu de séance
        </Button>
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

/** Cahier de textes : contenus des séances récentes, du plus récent au plus ancien. */
export function LessonNotesList({ notes, staff }: { notes: LessonNoteView[]; staff: boolean }) {
  if (!notes.length) return null;
  return (
    <section aria-labelledby="seances" className="flex flex-col gap-2.5">
      <h2 id="seances" className="m-0 font-display text-h3 font-bold">
        Contenu des séances
      </h2>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {notes.map((n) => (
          <li key={n.lessonId} className="flex flex-col gap-2 rounded-card border border-line bg-surface px-[1.125rem] py-4">
            <div className="flex flex-wrap items-center gap-2">
              {n.subject && <SubjectChip name={n.subject.name} hue={n.subject.hue} />}
              {staff && <span className="text-meta text-ink-muted">{n.className}</span>}
              <span className="text-meta text-ink-muted">{when(n.startsAt)}</span>
            </div>
            <p className="m-0 text-ui break-words whitespace-pre-line">{n.content}</p>
            <AttachmentList files={n.files} />
          </li>
        ))}
      </ul>
    </section>
  );
}
