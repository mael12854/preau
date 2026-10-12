"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  confirmDocument,
  deleteDocument,
  prepareDocument,
  signDocument,
} from "@/app/(app)/actions";
import { Checkbox } from "@/components/ui/choice";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { DocumentView } from "@/lib/data/types";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Filter = "all" | "Administratif" | "Pédagogique" | "sign";
const COLS = "@3xl:grid-cols-[minmax(0,1fr)_10rem_8.125rem_5.625rem_auto]";

type UploadOptions = {
  classes: { id: string; name: string }[];
  wholeSchool: boolean;
  teacher: boolean;
};
type Category = "administratif" | "pedagogique" | "cantine";
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.odt,.ods,.txt";

/** Ajouter un document : titre, destinataires, fichier (10 Mo au plus), envoi direct vers le stockage privé. */
function UploadDialog({ options }: { options: UploadOptions }) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(
    options.wholeSchool ? "etablissement" : (options.classes[0]?.id ?? ""),
  );
  const [category, setCategory] = useState<Category>(
    options.teacher ? "pedagogique" : "administratif",
  );
  const [sign, setSign] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const reset = () => {
    setTitle("");
    setSign(false);
    setFile(null);
    setError(null);
  };

  const submit = () => {
    if (!title.trim()) return setError("Indiquez un titre.");
    if (!file) return setError("Choisissez un fichier.");
    if (file.size > MAX_BYTES)
      return setError("Le fichier doit faire 10 Mo au plus.");
    setError(null);
    start(async () => {
      const ticket = await prepareDocument({
        title: title.trim(),
        category,
        classId: target === "etablissement" ? null : target,
        requiresSignature: sign,
        fileName: file.name,
        size: file.size,
        type: file.type,
      });
      if (!ticket.ok) return setError(ticket.error);
      const { error: upload } = await createBrowserSupabase()
        .storage.from("documents")
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type,
        });
      if (upload) {
        await deleteDocument(ticket.id);
        return setError("L'envoi du fichier n'a pas abouti. Réessayez.");
      }
      const done = await confirmDocument(ticket.id);
      if (!done.ok) return setError(done.error);
      toast({ title: `« ${title.trim()} » est en ligne` });
      reset();
      setOpen(false);
      router.refresh();
    });
  };

  const targets = [
    ...(options.wholeSchool
      ? [{ value: "etablissement", label: "Tout l'établissement" }]
      : []),
    ...options.classes.map((c) => ({ value: c.id, label: c.name })),
  ];
  const categories: { value: Category; label: string }[] = options.teacher
    ? [{ value: "pedagogique", label: "Pédagogique" }]
    : [
        { value: "administratif", label: "Administratif" },
        { value: "pedagogique", label: "Pédagogique" },
        { value: "cantine", label: "Cantine" },
      ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
      title="Ajouter un document"
      description="PDF, image, Word, Excel, OpenDocument ou texte, 10 Mo au plus."
      trigger={
        <Button icon="upload" className="h-10 px-4 text-label">
          Ajouter un document
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
        <TextField
          label="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
        />
        <SelectField
          label="Destinataires"
          options={targets}
          value={target}
          onValueChange={setTarget}
        />
        <SelectField
          label="Catégorie"
          options={categories}
          value={category}
          onValueChange={(v) => setCategory(v as Category)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="document-fichier" className="text-label font-bold">
            Fichier
          </label>
          <input
            id="document-fichier"
            type="file"
            accept={ACCEPT}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-label file:mr-3 file:h-10 file:rounded-control file:border file:border-line-strong file:bg-surface file:px-3.5 file:text-label file:font-bold"
          />
        </div>
        <Checkbox
          checked={sign}
          onCheckedChange={setSign}
          label="Demander une signature aux familles"
        />
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
            {pending ? "Envoi…" : "Publier"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Documents : filtres, liste, badge « À signer », téléchargement et ajout par le personnel. */
export function DocumentsScreen({
  documents: DOCUMENTS,
  upload,
}: {
  documents: DocumentView[];
  upload?: UploadOptions | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, start] = useTransition();
  const toSign = DOCUMENTS.filter((d) => d.toSign).length;
  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "Administratif", label: "Administratif" },
    { value: "Pédagogique", label: "Pédagogique" },
    { value: "sign", label: `À signer · ${toSign}` },
  ];
  const docs = DOCUMENTS.filter(
    (d) =>
      filter === "all" ||
      (filter === "sign" ? d.toSign : d.category === filter),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filtrer les documents"
          className="flex flex-wrap gap-2"
        >
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "relative rounded-full border px-3.5 py-2 text-label after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
                filter === f.value
                  ? "border-inverse bg-inverse font-bold text-on-inverse"
                  : "border-line bg-surface hover:border-line-strong",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {upload && <UploadDialog options={upload} />}
      </div>
      {docs.length === 0 && (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
          Aucun document pour l&apos;instant.
        </p>
      )}
      <div className="@container overflow-hidden rounded-card border border-line bg-surface">
        <div
          aria-hidden="true"
          className={cn(
            "hidden gap-4 border-b border-line bg-surface-2 px-5 py-3 text-meta text-ink-muted @3xl:grid",
            COLS,
          )}
        >
          <span>Nom</span>
          <span>Catégorie</span>
          <span>Ajouté le</span>
          <span>Taille</span>
          <span />
        </div>
        <ul className="m-0 list-none p-0" aria-live="polite">
          {docs.map((d) => (
            <li
              key={d.id}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-line-soft px-5 py-3.5 text-ui last:border-b-0",
                COLS,
              )}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Icon name={d.icon} size={24} className="text-brand" />
                <b>{d.name}</b>
                {d.toSign && (
                  <Badge tone="danger" className="text-xs">
                    À signer
                  </Badge>
                )}
                {d.signed && (
                  <Badge tone="ok" className="text-xs">
                    Signé
                  </Badge>
                )}
                {d.toSign && (
                  <Button
                    size="sm"
                    disabled={pending}
                    aria-label={`Signer « ${d.name} »`}
                    onClick={() =>
                      start(async () => {
                        const r = await signDocument(d.id);
                        toast({ title: r.ok ? "Document signé" : r.error });
                      })
                    }
                  >
                    Signer
                  </Button>
                )}
              </div>
              <span className="row-start-2 text-ink-2 @3xl:row-start-auto">
                <span className="sr-only">Catégorie : </span>
                {d.category}
                <span className="@3xl:hidden">
                  {" "}
                  · {d.date} · {d.size}
                </span>
              </span>
              <span className="hidden text-ink-2 @3xl:block">{d.date}</span>
              <span className="hidden text-ink-muted @3xl:block">{d.size}</span>
              <div className="col-start-2 row-span-2 row-start-1 flex items-center @3xl:col-start-auto @3xl:row-span-1 @3xl:row-start-auto">
                {d.downloadable ? (
                  <a
                    href={`/documents/${d.id}/fichier`}
                    aria-label={`Télécharger ${d.name} (${d.size})`}
                    className="flex size-11 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
                  >
                    <Icon name="download" size={22} />
                  </a>
                ) : (
                  <span className="sr-only">Fichier non disponible</span>
                )}
                {d.canDelete && (
                  <button
                    type="button"
                    disabled={pending}
                    aria-label={`Retirer « ${d.name} »`}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Retirer « ${d.name} » ? Le fichier sera supprimé pour tout le monde.`,
                        )
                      )
                        return;
                      start(async () => {
                        const r = await deleteDocument(d.id);
                        toast({ title: r.ok ? "Document retiré" : r.error });
                        if (r.ok) router.refresh();
                      });
                    }}
                    className="flex size-11 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
                  >
                    <Icon name="delete" size={22} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
