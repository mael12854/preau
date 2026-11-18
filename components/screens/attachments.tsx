"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { confirmAttachment, prepareAttachment, removeAttachment } from "@/app/(app)/actions";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import type { AttachmentView } from "@/lib/data/types";
import { formatSize } from "@/lib/format";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/** Types acceptés (mêmes que les Documents et que la configuration du compartiment). */
export const ATTACHMENT_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.odt,.ods,.txt";

/**
 * Envoie des fichiers en pièces jointes d'un devoir ou d'un contenu de séance :
 * ticket signé côté serveur, envoi direct au stockage, puis confirmation. Renvoie un message d'erreur, ou null.
 */
export async function uploadAttachments(
  target: { homeworkId: string } | { lessonId: string },
  files: File[],
): Promise<string | null> {
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) return `« ${file.name} » dépasse 10 Mo.`;
    const ticket = await prepareAttachment({
      homeworkId: "homeworkId" in target ? target.homeworkId : null,
      lessonId: "lessonId" in target ? target.lessonId : null,
      fileName: file.name,
      size: file.size,
      type: file.type,
    });
    if (!ticket.ok) return `${file.name} : ${ticket.error}`;
    const { error } = await createBrowserSupabase()
      .storage.from("documents")
      .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
    if (error) {
      await removeAttachment(ticket.id);
      return `L'envoi de « ${file.name} » n'a pas abouti. Réessayez.`;
    }
    const done = await confirmAttachment(ticket.id);
    if (!done.ok) return done.error;
  }
  return null;
}

/** Choisir des fichiers à joindre (plusieurs à la fois). */
export function FilePicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex w-fit min-h-11 cursor-pointer items-center gap-2 rounded-control border border-line px-3.5 text-label font-bold hover:border-line-strong">
        <Icon name="attach_file" size={20} />
        Joindre des fichiers
        <input
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT}
          className="sr-only"
          onChange={(e) => {
            onChange([...files, ...Array.from(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </label>
      {files.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-caption">
              <Icon name="attach_file" size={16} />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="text-ink-muted">{formatSize(f.size)}</span>
              <button
                type="button"
                aria-label={`Ne pas joindre ${f.name}`}
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="flex size-8 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
              >
                <Icon name="close" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <span className="text-caption text-ink-muted">PDF, image, Word, Excel, OpenDocument ou texte · 10 Mo au plus par fichier.</span>
    </div>
  );
}

/** Pièces jointes déjà en ligne : liens de téléchargement ; l'auteur peut les retirer. */
export function AttachmentList({ files, removable = false }: { files: AttachmentView[]; removable?: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  if (!files.length) return null;
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {files.map((f) => (
        <li key={f.id} className="flex items-center gap-1">
          <a
            href={`/devoirs/pj/${f.id}`}
            className="flex min-h-10 min-w-0 items-center gap-1.5 text-sm font-bold text-brand no-underline hover:underline"
          >
            <Icon name="attach_file" size={18} />
            <span className="truncate">{f.name}</span>
            <span className="shrink-0 font-normal text-ink-muted">· {formatSize(f.size)}</span>
            <span className="sr-only"> (pièce jointe)</span>
          </a>
          {removable && (
            <button
              type="button"
              disabled={pending}
              aria-label={`Retirer ${f.name}`}
              onClick={() => {
                if (!window.confirm(`Retirer « ${f.name} » ?`)) return;
                start(async () => {
                  const r = await removeAttachment(f.id);
                  toast({ title: r.ok ? "Pièce jointe retirée" : r.error });
                  if (r.ok) router.refresh();
                });
              }}
              className="flex size-9 shrink-0 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
