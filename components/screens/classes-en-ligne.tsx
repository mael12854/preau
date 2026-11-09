"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeClassLink, saveClassLink, setStudentAppLogin } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { ClassLink, LinkKind, OnlineClass } from "@/lib/data/online";
import { CATALOG, secondField } from "@/lib/apps";
import type { IconName } from "@/lib/icons";

/** Types proposés. Tinkercad est enregistré comme « autre » et reconnu à son lien ou à son nom. */
type UiKind = LinkKind | "tinkercad";
const TINKERCAD_JOIN = "https://www.tinkercad.com/joinclass";
const KINDS: { value: UiKind; label: string; name: string; icon: IconName; urlHint: string; codeLabel: string }[] = [
  { value: "meet", label: "Google Meet", name: "Classe virtuelle", icon: "cast_for_education", urlHint: "https://meet.google.com/abc-defg-hij", codeLabel: "Code de la réunion (facultatif)" },
  { value: "kahoot", label: "Kahoot!", name: "Kahoot", icon: "apps", urlHint: "https://kahoot.it", codeLabel: "Code PIN" },
  { value: "duolingo", label: "Duolingo", name: "Classe Duolingo", icon: "apps", urlHint: "https://www.duolingo.com/classroom/…", codeLabel: "Code de classe" },
  { value: "tinkercad", label: "Tinkercad", name: "Classe Tinkercad", icon: "extension", urlHint: TINKERCAD_JOIN, codeLabel: "Code de classe" },
  { value: "autre", label: "Autre", name: "", icon: "link", urlHint: "https://…", codeLabel: "Code (facultatif)" },
];
const kindOf = (k: UiKind) => KINDS.find((x) => x.value === k)!;
const uiKind = (l: ClassLink): UiKind =>
  l.kind === "autre" && (/tinkercad\.com/i.test(l.url ?? "") || /^tinkercad|tinkercad$/i.test(l.label.trim()) || /classe tinkercad/i.test(l.label))
    ? "tinkercad"
    : l.kind;

/** Copier un code, avec un retour pour les lecteurs d'écran. */
function CopyCode({ code }: { code: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code).then(
          () => toast({ title: `Code ${code} copié` }),
          () => toast({ title: "La copie n'a pas abouti : sélectionnez le code à la main." }),
        );
      }}
      aria-label={`Copier le code ${code}`}
      className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface-2 px-2.5 font-mono text-ui font-bold tracking-wide hover:border-line-strong"
    >
      {code}
      <Icon name="content_copy" size={18} className="text-ink-muted" />
    </button>
  );
}

function LinkDialog({ classId, link, trigger }: { classId: string; link?: ClassLink; trigger: React.ReactNode }) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<UiKind>(link ? uiKind(link) : "meet");
  const [label, setLabel] = useState(link?.label ?? KINDS[0].name);
  const [url, setUrl] = useState(link?.url ?? "");
  const [code, setCode] = useState(link?.code ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const k = kindOf(kind);
  return (
    <Dialog open={open} onOpenChange={setOpen} title={link ? "Modifier le lien" : "Ajouter un lien"} trigger={trigger}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim()) return setError("Donnez un nom au lien.");
          if (!url.trim() && !code.trim()) return setError("Indiquez un lien ou un code.");
          if (url.trim() && !url.trim().startsWith("https://")) return setError("Le lien doit commencer par https://");
          setError(null);
          start(async () => {
            // Tinkercad : type « autre » ; sans lien, celui de la page « Rejoindre une classe ».
            const finalUrl = kind === "tinkercad" && !url.trim() ? TINKERCAD_JOIN : url.trim();
            const r = await saveClassLink({
              id: link?.id ?? null,
              classId,
              kind: kind === "tinkercad" ? "autre" : kind,
              label: label.trim(),
              url: finalUrl,
              code: code.trim(),
            });
            if (!r.ok) return setError(r.error ?? "");
            toast({ title: link ? "Lien modifié" : "Lien ajouté" });
            setOpen(false);
            if (!link) {
              setUrl("");
              setCode("");
            }
            router.refresh();
          });
        }}
      >
        <SelectField
          label="Type"
          options={KINDS.map((x) => ({ value: x.value, label: x.label }))}
          value={kind}
          onValueChange={(v) => {
            const next = v as UiKind;
            if (!label.trim() || KINDS.some((x) => x.name === label)) setLabel(kindOf(next).name);
            setKind(next);
          }}
        />
        <TextField label="Nom" value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} required />
        <TextField label="Lien" type="url" inputMode="url" placeholder={k.urlHint} value={url} onChange={(e) => setUrl(e.target.value)} />
        <TextField label={k.codeLabel} value={code} maxLength={80} onChange={(e) => setCode(e.target.value)} />
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

function LinkRow({ link, classId, editable }: { link: ClassLink; classId: string; editable: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const k = kindOf(uiKind(link));
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-3 last:border-b-0">
      <Icon name={k.icon} size={22} className="text-brand" />
      <div className="flex min-w-0 flex-1 flex-col">
        <b className="text-ui">{link.label}</b>
        <span className="text-caption text-ink-muted">{k.label}</span>
      </div>
      {link.code && <CopyCode code={link.code} />}
      {link.url && (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-control bg-brand px-4 text-label font-bold text-on-brand hover:opacity-90"
        >
          {link.kind === "meet" ? "Rejoindre" : "Ouvrir"}
          <Icon name="open_in_new" size={18} />
          <span className="sr-only">(nouvel onglet)</span>
        </a>
      )}
      {editable && (
        <span className="flex gap-1">
          <LinkDialog
            classId={classId}
            link={link}
            trigger={
              <button type="button" aria-label={`Modifier ${link.label}`} className="flex size-10 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg">
                <Icon name="edit" size={20} />
              </button>
            }
          />
          <button
            type="button"
            disabled={pending}
            aria-label={`Retirer ${link.label}`}
            className="flex size-10 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
            onClick={() => {
              if (!window.confirm(`Retirer « ${link.label} » ?`)) return;
              start(async () => {
                const r = await removeClassLink(link.id);
                toast({ title: r.ok ? "Lien retiré" : r.error });
                if (r.ok) router.refresh();
              });
            }}
          >
            <Icon name="delete" size={20} />
          </button>
        </span>
      )}
    </li>
  );
}

/** Identifiants et mots de passe d'une appli (ex. Scratch) pour chaque élève : saisis par le professeur, vus par l'élève et sa famille dans « Mes applis ». */
function StudentLogins({
  classId,
  students,
  logins,
}: {
  classId: string;
  students: { id: string; name: string }[];
  logins: Record<string, Record<string, { login: string; password: string }>>;
}) {
  const toast = useToast();
  const [app, setApp] = useState("scratch");
  const [saved, setSaved] = useState(logins);
  const [version, setVersion] = useState(0);
  const [shared, setShared] = useState("");
  const [pending, start] = useTransition();
  const appName = CATALOG.find((a) => a.key === app)?.name ?? app;
  const field = secondField(app);
  // Code commun (ex. code de classe Tinkercad) : enregistré pour tous les élèves, identifiants conservés.
  const applyToAll = () =>
    start(async () => {
      const value = shared.trim();
      if (!value) return;
      const next = { ...(saved[app] ?? {}) };
      for (const st of students) {
        const login = next[st.id]?.login ?? "";
        const r = await setStudentAppLogin(st.id, app, login, value);
        if (!r.ok) return toast({ title: `${st.name} : ${r.error}` });
        next[st.id] = { login, password: value };
      }
      setSaved((x) => ({ ...x, [app]: next }));
      setVersion((v) => v + 1);
      toast({ title: `${field.second} enregistré pour les ${students.length} élèves` });
    });
  const filled = Object.values(saved[app] ?? {}).filter((c) => c.login || c.password).length;
  return (
    <details className="border-b border-line">
      <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-5 py-2 text-label font-bold">
        <Icon name="badge" size={20} className="text-brand" />
        Identifiants des élèves
        <span className="font-normal text-ink-muted">
          · {appName} : {filled}/{students.length}
        </span>
      </summary>
      <div className="flex flex-col gap-3 px-5 pb-4">
        <p className="m-0 text-caption leading-[1.45] text-ink-2">
          Pour les comptes créés par l&apos;établissement. Chaque élève et sa famille retrouvent ces informations dans
          « Mes applis ». Ils ne sont visibles que par l&apos;élève, sa famille, ses professeurs et l&apos;administration.
        </p>
        <SelectField
          label="Appli"
          options={CATALOG.map((a) => ({ value: a.key, label: a.name }))}
          value={app}
          onValueChange={setApp}
          className="max-w-64"
        />
        {field.sharedByClass && (
          <div className="flex flex-wrap items-end gap-2">
            <TextField
              label={`${field.second} (le même pour toute la classe)`}
              value={shared}
              maxLength={120}
              onChange={(e) => setShared(e.target.value)}
            />
            <Button type="button" variant="secondary" className="h-12 px-4 text-label" disabled={pending || !shared.trim()} onClick={applyToAll}>
              {pending ? "Enregistrement…" : "Appliquer à tous"}
            </Button>
          </div>
        )}
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {students.map((st) => (
            <CredentialRow
              key={`${app}-${st.id}-${version}`}
              classId={classId}
              field={field}
              app={app}
              appName={appName}
              student={st}
              initial={saved[app]?.[st.id] ?? { login: "", password: "" }}
              onSaved={(c) => setSaved((x) => ({ ...x, [app]: { ...(x[app] ?? {}), [st.id]: c } }))}
            />
          ))}
        </ul>
      </div>
    </details>
  );
}

function CredentialRow({
  classId,
  field,
  app,
  appName,
  student,
  initial,
  onSaved,
}: {
  classId: string;
  field: { second: string; secret: boolean };
  app: string;
  appName: string;
  student: { id: string; name: string };
  initial: { login: string; password: string };
  onSaved: (c: { login: string; password: string }) => void;
}) {
  const toast = useToast();
  const [login, setLogin] = useState(initial.login);
  const [password, setPassword] = useState(initial.password);
  const [last, setLast] = useState(initial);
  const [, start] = useTransition();
  const id = `cred-${classId}-${app}-${student.id}`;
  const save = () => {
    const next = { login: login.trim(), password };
    if (next.login === last.login && next.password === last.password) return;
    start(async () => {
      const r = await setStudentAppLogin(student.id, app, next.login, next.password);
      if (!r.ok) return toast({ title: r.error });
      setLast(next);
      onSaved(next);
      toast({ title: `${appName} : ${student.name} enregistré` });
    });
  };
  const enter = (e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur());
  return (
    <li className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)_minmax(0,12rem)] sm:items-center sm:gap-3">
      <span className="truncate text-ui font-bold sm:font-normal">{student.name}</span>
      <input
        id={`${id}-login`}
        aria-label={`Identifiant ${appName} de ${student.name}`}
        value={login}
        maxLength={120}
        autoComplete="off"
        placeholder="Identifiant"
        onChange={(e) => setLogin(e.target.value)}
        onBlur={save}
        onKeyDown={enter}
        className="h-10 rounded-control border border-line bg-surface px-2.5 text-label"
      />
      <input
        id={`${id}-pwd`}
        aria-label={`${field.second} ${appName} de ${student.name}`}
        value={password}
        maxLength={120}
        autoComplete="off"
        spellCheck={false}
        placeholder={field.second}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={save}
        onKeyDown={enter}
        className="h-10 rounded-control border border-line bg-surface px-2.5 font-mono text-label"
      />
    </li>
  );
}

/** Mes classes en ligne : Meet, Kahoot, Duolingo… de chaque classe. Les professeurs de la classe les tiennent à jour. */
export function ClassesEnLigneScreen({ classes }: { classes: OnlineClass[] }) {
  if (!classes.length)
    return (
      <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
        Aucune classe pour l&apos;instant.
      </p>
    );
  return (
    <div className="flex flex-col gap-4">
      {classes.map((c) => (
        <section key={c.id} aria-labelledby={`classe-${c.id}`} className="overflow-hidden rounded-card border border-line bg-surface">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-5 py-3">
            <h2 id={`classe-${c.id}`} className="m-0 font-display text-ui font-bold">
              {c.name}
            </h2>
            {c.editable && (
              <span className="flex flex-wrap gap-2">
              <a
                href={`/liste-de-classe?classe=${c.id}`}
                download
                className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-label font-bold text-ink hover:border-line-strong"
              >
                <Icon name="picture_as_pdf" size={18} />
                Liste de classe
                <span className="sr-only"> de {c.name} (PDF)</span>
              </a>
              <LinkDialog
                classId={c.id}
                trigger={
                  <Button icon="add" variant="secondary" className="h-9 px-3 text-label">
                    Ajouter un lien
                  </Button>
                }
              />
              </span>
            )}
          </header>
          {c.editable && c.students && c.students.length > 0 && (
            <StudentLogins classId={c.id} students={c.students} logins={c.logins ?? {}} />
          )}
          {c.links.length ? (
            <ul className="m-0 list-none p-0">
              {c.links.map((l) => (
                <LinkRow key={l.id} link={l} classId={c.id} editable={c.editable} />
              ))}
            </ul>
          ) : (
            <p className="m-0 px-5 py-4 text-label text-ink-2">
              {c.editable ? "Aucun lien : ajoutez le Meet, le code Duolingo ou le Kahoot de la classe." : "Aucun lien pour l'instant."}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
