"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  resetPassword,
  updatePersonEmail,
  updatePersonName,
} from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import type { PersonView } from "@/lib/data/directory";
import {
  AddPerson,
  PersonLinks,
  type ClassOption,
  type SubjectOption,
} from "./annuaire-create";

const GROUPS: { kind: PersonView["kind"]; label: string }[] = [
  { kind: "direction", label: "Direction" },
  { kind: "secretariat", label: "Secrétariat" },
  { kind: "cpe", label: "Vie scolaire" },
  { kind: "prof", label: "Enseignants" },
  { kind: "eleve", label: "Élèves" },
  { kind: "parent", label: "Responsables légaux" },
];

const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Modifier le nom et l'adresse e-mail d'une personne. */
/** Nouveau mot de passe provisoire, affiché une seule fois. */
function ResetPassword({ person }: { person: PersonView }) {
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2 border-t border-line-soft pt-4">
      {password ? (
        <div
          role="status"
          className="flex flex-col gap-1 rounded-control bg-bg p-3.5 text-label"
        >
          <span>
            Identifiant : <b>{person.email}</b>
          </span>
          <span>
            Nouveau mot de passe provisoire :{" "}
            <b className="tabular select-all">{password}</b>
          </span>
          <span className="text-caption text-ink-muted">
            Il ne sera plus affiché : notez-le et transmettez-le à la personne.
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-label text-ink-2">
            Mot de passe oublié ou mal saisi ?
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            className="h-10 px-3.5 text-label"
            onClick={() => {
              if (
                !window.confirm(
                  `Donner un nouveau mot de passe provisoire à ${person.displayName} ? L'ancien ne fonctionnera plus.`,
                )
              )
                return;
              start(async () => {
                const r = await resetPassword(person.id);
                if (r.ok) setPassword(r.password);
                else setError(r.error);
              });
            }}
          >
            Réinitialiser le mot de passe
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="m-0 text-label text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type Context = {
  people: PersonView[];
  classes: ClassOption[];
  subjects: SubjectOption[];
};

function EditPerson({
  person,
  context,
}: {
  person: PersonView;
  context: Context;
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [civility, setCivility] = useState<string>(person.civility ?? "aucune");
  const [first, setFirst] = useState(person.firstName);
  const [last, setLast] = useState(person.lastName || person.displayName);
  const [email, setEmail] = useState(person.email);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    if (!last.trim()) return setError("Indiquez au moins le nom de famille.");
    setError(null);
    start(async () => {
      const r = await updatePersonName(
        person.id,
        first,
        last,
        civility === "aucune" ? null : (civility as "madame" | "monsieur"),
      );
      if (!r.ok) return setError(r.error);
      if (email.trim() && email.trim().toLowerCase() !== person.email) {
        const e = await updatePersonEmail(person.id, email);
        if (!e.ok) return setError(e.error);
      }
      toast({ title: "Modifications enregistrées" });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={`Modifier · ${person.displayName}`}
      description={
        person.hasAccount
          ? "L'adresse e-mail est aussi l'adresse de connexion de cette personne."
          : "Cette personne n'a pas de compte de connexion."
      }
      trigger={
        <button
          type="button"
          aria-label={`Modifier ${person.displayName}`}
          className="flex size-11 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
        >
          <Icon name="edit" size={22} />
        </button>
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
          label="Civilité"
          options={[
            { value: "aucune", label: "Non précisée" },
            { value: "madame", label: "Madame" },
            { value: "monsieur", label: "Monsieur" },
          ]}
          value={civility}
          onValueChange={setCivility}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Prénom"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            maxLength={80}
            autoComplete="off"
          />
          <TextField
            label="Nom"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            maxLength={80}
            required
            autoComplete="off"
          />
        </div>
        <TextField
          label="Adresse e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
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
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
      {person.hasAccount && <ResetPassword person={person} />}
      <PersonLinks person={person} {...context} />
    </Dialog>
  );
}

/** Annuaire de l'établissement : recherche, groupes par fonction, modification des noms et adresses. */
export function DirectoryScreen({
  people,
  classes,
  subjects,
  canAddDirection,
}: {
  people: PersonView[];
  classes: ClassOption[];
  subjects: SubjectOption[];
  canAddDirection: boolean;
}) {
  const context = { people, classes, subjects };
  const [query, setQuery] = useState("");
  const q = fold(query.trim());
  const shown = q
    ? people.filter((p) =>
        fold(
          `${p.displayName} ${p.firstName} ${p.lastName} ${p.email} ${p.detail}`,
        ).includes(q),
      )
    : people;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <TextField
          label="Rechercher une personne"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        <AddPerson
          people={people}
          classes={classes}
          subjects={subjects}
          canAddDirection={canAddDirection}
        />
      </div>
      {shown.length === 0 && (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
          Personne ne correspond.
        </p>
      )}
      {GROUPS.map((g) => {
        const list = shown.filter((p) => p.kind === g.kind);
        if (!list.length) return null;
        return (
          <section
            key={g.kind}
            aria-labelledby={`annuaire-${g.kind}`}
            className="rounded-card border border-line bg-surface"
          >
            <h2
              id={`annuaire-${g.kind}`}
              className="m-0 border-b border-line px-5 py-3.5 font-display text-card font-bold"
            >
              {g.label}{" "}
              <span className="text-label font-normal text-ink-muted">
                · {list.length}
              </span>
            </h2>
            <ul className="m-0 list-none p-0">
              {list.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line-soft px-5 py-2.5 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <b className="text-ui">{p.displayName}</b>
                    <span className="text-caption text-ink-muted">
                      {[p.detail, p.email].filter(Boolean).join(" · ") ||
                        "Aucune adresse"}
                    </span>
                  </div>
                  {!p.hasAccount && <Badge tone="neutral">Sans compte</Badge>}
                  <EditPerson person={p} context={context} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
