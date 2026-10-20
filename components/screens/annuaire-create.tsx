"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addClassMember,
  assignTeaching,
  createPerson,
  linkGuardian,
  removeClassMember,
  type NewPerson,
} from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import type { PersonView } from "@/lib/data/directory";

export type ClassOption = {
  id: string;
  name: string;
  level: "primaire" | "college" | "lycee";
};
export type SubjectOption = { id: string; name: string };
type Teaching = NewPerson["teachings"][number];

const KINDS: { value: NewPerson["kind"]; label: string }[] = [
  { value: "eleve", label: "Élève" },
  { value: "parent", label: "Responsable légal" },
  { value: "prof", label: "Enseignant" },
  { value: "cpe", label: "Vie scolaire (CPE)" },
  { value: "secretariat", label: "Secrétariat" },
  { value: "direction", label: "Direction" },
];

/** Choix d'une classe (et d'une matière, hors primaire) pour un enseignant. */
function TeachingPicker({
  classes,
  subjects,
  onAdd,
}: {
  classes: ClassOption[];
  subjects: SubjectOption[];
  onAdd: (t: Teaching) => void;
}) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const primary = classes.find((c) => c.id === classId)?.level === "primaire";
  if (!classes.length)
    return (
      <p className="m-0 text-caption text-ink-muted">
        Aucune classe dans l&apos;établissement.
      </p>
    );
  return (
    <div className="flex flex-wrap items-end gap-3">
      <SelectField
        label="Classe"
        options={classes.map((c) => ({ value: c.id, label: c.name }))}
        value={classId}
        onValueChange={setClassId}
        className="min-w-32"
      />
      {primary ? (
        <p className="m-0 pb-3 text-caption text-ink-muted">
          Primaire : titulaire, toutes les matières.
        </p>
      ) : (
        <SelectField
          label="Matière"
          options={subjects.map((s) => ({ value: s.id, label: s.name }))}
          value={subjectId}
          onValueChange={setSubjectId}
          className="min-w-40"
        />
      )}
      <Button
        type="button"
        variant="secondary"
        className="h-12 px-3.5 text-label"
        onClick={() =>
          onAdd({ classId, subjectId: primary ? null : subjectId })
        }
      >
        Ajouter
      </Button>
    </div>
  );
}

/** Ajouter une personne : fiche, rattachements, et compte de connexion si une adresse est donnée. */
export function AddPerson({
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
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<NewPerson["kind"]>("eleve");
  const [civility, setCivility] = useState("aucune");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [children, setChildren] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [teachings, setTeachings] = useState<Teaching[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    name: string;
    email: string;
    password: string | null;
    linked?: boolean;
  } | null>(null);
  const [pending, start] = useTransition();
  const students = people.filter((p) => p.kind === "eleve");
  const [child, setChild] = useState(students[0]?.id ?? "");
  const name = (id: string) =>
    people.find((p) => p.id === id)?.displayName ?? "";
  const className = (id: string) =>
    classes.find((c) => c.id === id)?.name ?? "";

  const reset = () => {
    setFirst("");
    setLast("");
    setEmail("");
    setChildren([]);
    setExtras([]);
    setTeachings([]);
    setError(null);
    setCreated(null);
  };

  const submit = () => {
    if (!last.trim()) return setError("Indiquez au moins le nom de famille.");
    if (kind === "eleve" && !classId)
      return setError("Choisissez la classe de l'élève.");
    setError(null);
    start(async () => {
      const r = await createPerson({
        kind,
        firstName: first,
        lastName: last,
        civility:
          civility === "aucune" ? null : (civility as "madame" | "monsieur"),
        email,
        classId: kind === "eleve" ? classId : null,
        children: kind === "parent" ? children : [],
        teachings: kind === "prof" ? teachings : [],
        extraClasses:
          kind === "eleve" ? extras.filter((c) => c !== classId) : [],
      });
      if (!r.ok) return setError(r.error);
      setCreated({
        name: [first, last].filter(Boolean).join(" "),
        email: email.trim(),
        password: r.password,
        linked: !!r.linked,
      });
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
      title="Ajouter une personne"
      description={
        created
          ? undefined
          : "Avec une adresse e-mail, un compte de connexion est créé avec un mot de passe provisoire."
      }
      trigger={
        <Button icon="add" className="h-10 px-4 text-label">
          Ajouter une personne
        </Button>
      }
    >
      {created ? (
        <div className="flex flex-col gap-4" role="status">
          <p className="m-0 text-ui">
            La fiche de <b>{created.name}</b> est créée.
          </p>
          {created.password ? (
            <div className="flex flex-col gap-1.5 rounded-control bg-bg p-3.5">
              <span className="text-label">
                Identifiant : <b>{created.email}</b>
              </span>
              <span className="text-label">
                Mot de passe provisoire :{" "}
                <b className="tabular select-all">{created.password}</b>
              </span>
              <span className="text-caption text-ink-muted">
                Il ne sera plus affiché : notez-le et transmettez-le à la
                personne, qui devra le changer.
              </span>
            </div>
          ) : created.linked ? (
            <p className="m-0 text-label text-ink-2">
              L&apos;adresse <b>{created.email}</b> avait déjà un compte : cette
              fiche y est ajoutée comme un espace de plus. La personne se
              connecte comme d&apos;habitude, puis choisit son espace dans le
              menu « Espace ».
            </p>
          ) : (
            <p className="m-0 text-label text-ink-2">
              Pas d&apos;adresse e-mail : aucun compte de connexion. Vous
              pourrez en ajouter une plus tard.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-10 px-4 text-label"
              onClick={reset}
            >
              Ajouter une autre personne
            </Button>
            <Button
              type="button"
              className="h-10 px-4 text-label"
              onClick={() => setOpen(false)}
            >
              Terminer
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <SelectField
            label="Fonction"
            options={KINDS.filter(
              (k) => k.value !== "direction" || canAddDirection,
            )}
            value={kind}
            onValueChange={(v) => setKind(v as NewPerson["kind"])}
          />
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
            label="Adresse e-mail (facultative)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
          />

          {kind === "eleve" && (
            <>
              <SelectField
                label="Classe principale"
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
                value={classId}
                onValueChange={setClassId}
              />
              {classes.length > 1 && (
                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                  <legend className="mb-1 text-label font-bold">
                    Classes supplémentaires (facultatif)
                  </legend>
                  {classes
                    .filter((c) => c.id !== classId)
                    .map((c) => (
                      <Checkbox
                        key={c.id}
                        checked={extras.includes(c.id)}
                        onCheckedChange={(on) =>
                          setExtras((x) =>
                            on ? [...x, c.id] : x.filter((y) => y !== c.id),
                          )
                        }
                        label={c.name}
                      />
                    ))}
                </fieldset>
              )}
            </>
          )}

          {kind === "parent" && (
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-1 text-label font-bold">Enfants</legend>
              {children.map((id) => (
                <span
                  key={id}
                  className="flex items-center justify-between rounded-control bg-bg px-3 py-2 text-label"
                >
                  {name(id)}
                  <button
                    type="button"
                    aria-label={`Retirer ${name(id)}`}
                    onClick={() =>
                      setChildren((c) => c.filter((x) => x !== id))
                    }
                    className="flex size-9 items-center justify-center rounded-control hover:bg-neutral-bg"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </span>
              ))}
              {students.length ? (
                <div className="flex items-end gap-3">
                  <SelectField
                    label="Élève"
                    options={students.map((s) => ({
                      value: s.id,
                      label: `${s.displayName} · ${s.detail}`,
                    }))}
                    value={child}
                    onValueChange={setChild}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 px-3.5 text-label"
                    onClick={() =>
                      child &&
                      !children.includes(child) &&
                      setChildren((c) => [...c, child])
                    }
                  >
                    Ajouter
                  </Button>
                </div>
              ) : (
                <p className="m-0 text-caption text-ink-muted">
                  Ajoutez d&apos;abord les élèves.
                </p>
              )}
            </fieldset>
          )}

          {kind === "prof" && (
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-1 text-label font-bold">Classes</legend>
              {teachings.map((t, i) => (
                <span
                  key={`${t.classId}-${t.subjectId}`}
                  className="flex items-center justify-between rounded-control bg-bg px-3 py-2 text-label"
                >
                  {className(t.classId)} ·{" "}
                  {t.subjectId
                    ? (subjects.find((s) => s.id === t.subjectId)?.name ??
                      t.subjectId)
                    : "titulaire"}
                  <button
                    type="button"
                    aria-label="Retirer cette classe"
                    onClick={() =>
                      setTeachings((x) => x.filter((_, j) => j !== i))
                    }
                    className="flex size-9 items-center justify-center rounded-control hover:bg-neutral-bg"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </span>
              ))}
              <TeachingPicker
                classes={classes}
                subjects={subjects}
                onAdd={(t) =>
                  setTeachings((x) =>
                    x.some(
                      (y) =>
                        y.classId === t.classId && y.subjectId === t.subjectId,
                    )
                      ? x
                      : [...x, t],
                  )
                }
              />
            </fieldset>
          )}

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
              {pending ? "Ajout…" : "Ajouter"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

/** Fiche existante : rattacher un enfant (responsable) ou confier une classe (enseignant). */
export function PersonLinks({
  person,
  people,
  classes,
  subjects,
}: {
  person: PersonView;
  people: PersonView[];
  classes: ClassOption[];
  subjects: SubjectOption[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const students = people.filter((p) => p.kind === "eleve");
  const [child, setChild] = useState(students[0]?.id ?? "");
  const [extraClass, setExtraClass] = useState("");
  const done = (r: { ok: boolean; error?: string }, ok: string) => {
    toast({ title: r.ok ? ok : (r.error ?? "") });
    if (r.ok) router.refresh();
  };

  if (person.kind === "eleve") {
    const others = classes.filter(
      (c) =>
        c.id !== person.classId &&
        !person.extraClasses.some((x) => x.id === c.id),
    );
    const pick =
      others.find((c) => c.id === extraClass)?.id ?? others[0]?.id ?? "";
    return (
      <fieldset className="m-0 flex flex-col gap-2 border-0 border-t border-line-soft p-0 pt-4">
        <legend className="mb-1 text-label font-bold">
          Classes supplémentaires
        </legend>
        <p className="m-0 text-caption text-ink-muted">
          En plus de sa classe principale (par exemple « Cours Sup »).
        </p>
        {person.extraClasses.map((c) => (
          <span
            key={c.id}
            className="flex items-center justify-between rounded-control bg-bg px-3 py-2 text-label"
          >
            {c.name}
            <button
              type="button"
              disabled={pending}
              aria-label={`Retirer de ${c.name}`}
              onClick={() =>
                start(async () =>
                  done(
                    await removeClassMember(person.id, c.id),
                    `Retiré de ${c.name}`,
                  ),
                )
              }
              className="flex size-9 items-center justify-center rounded-control hover:bg-neutral-bg"
            >
              <Icon name="close" size={18} />
            </button>
          </span>
        ))}
        {others.length > 0 && (
          <div className="flex items-end gap-3">
            <SelectField
              label="Ajouter une classe"
              options={others.map((c) => ({ value: c.id, label: c.name }))}
              value={pick}
              onValueChange={setExtraClass}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              className="h-12 px-3.5 text-label"
              onClick={() =>
                start(async () =>
                  done(await addClassMember(person.id, pick), "Classe ajoutée"),
                )
              }
            >
              Ajouter
            </Button>
          </div>
        )}
      </fieldset>
    );
  }

  if (person.kind === "parent")
    return students.length ? (
      <div className="flex items-end gap-3 border-t border-line-soft pt-4">
        <SelectField
          label="Rattacher un enfant"
          options={students.map((s) => ({
            value: s.id,
            label: `${s.displayName} · ${s.detail}`,
          }))}
          value={child}
          onValueChange={setChild}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          className="h-12 px-3.5 text-label"
          onClick={() =>
            start(async () =>
              done(await linkGuardian(person.id, child), "Enfant rattaché"),
            )
          }
        >
          Rattacher
        </Button>
      </div>
    ) : null;

  if (person.kind === "prof")
    return (
      <fieldset className="m-0 flex flex-col gap-2 border-0 border-t border-line-soft p-0 pt-4">
        <legend className="mb-1 text-label font-bold">
          Confier une classe
        </legend>
        <TeachingPicker
          classes={classes}
          subjects={subjects}
          onAdd={(t) =>
            start(async () =>
              done(
                await assignTeaching(person.id, t.classId, t.subjectId),
                "Classe confiée",
              ),
            )
          }
        />
      </fieldset>
    );
  return null;
}
