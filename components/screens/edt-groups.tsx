"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClassGroups, setStudentGroup } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export type ClassGroup = { id: string; name: string; family: string };
export type GroupStudent = {
  id: string;
  name: string;
  /** Groupe de l'élève par famille (nul : aucun). */
  groups: Record<string, string | null>;
};

const NONE = "aucun";

/**
 * Groupes d'une classe (secrétariat) : demi-groupes, LV2, LV3 ou toute autre famille.
 * Un élève a au plus un groupe par famille ; ses cours de groupe n'apparaissent que dans son EDT.
 */
export function ClassGroupsEditor({
  classId,
  className,
  groups,
  students,
}: {
  classId: string;
  className: string;
  groups: ClassGroup[];
  students: GroupStudent[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const families = [...new Set(groups.map((g) => g.family))];

  const assign = (studentId: string, family: string, value: string) =>
    start(async () => {
      const r = await setStudentGroup(
        studentId,
        classId,
        family,
        value === NONE ? null : value,
      );
      toast({ title: r.ok ? "Groupe enregistré" : (r.error ?? "") });
      if (r.ok) router.refresh();
    });

  return (
    <section
      aria-labelledby="edt-groupes"
      className="rounded-card border border-line bg-surface"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 id="edt-groupes" className="m-0 font-display text-card font-bold">
          Groupes · {className}
        </h2>
        <AddGroups classId={classId} className={className} families={families} />
      </div>
      {families.length === 0 ? (
        <p className="m-0 px-5 py-4 text-ui text-ink-2">
          Aucun groupe dans cette classe. Créez des demi-groupes (G1, G2) ou
          des groupes de langue (LV2, LV3).
        </p>
      ) : (
        <>
          <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-1 border-b border-line-soft px-5 py-3 text-label text-ink-2">
            {families.map((f) => (
              <li key={f}>
                <b className="text-ink">{f}</b> :{" "}
                {groups
                  .filter((g) => g.family === f)
                  .map((g) => g.name)
                  .join(", ")}
              </li>
            ))}
          </ul>
          {students.length === 0 ? (
            <p className="m-0 px-5 py-4 text-ui text-ink-2">
              Aucun élève dans cette classe.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {students.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-end gap-3 border-b border-line-soft px-5 py-3 last:border-b-0"
                >
                  <b className="min-w-44 flex-1 self-center text-label">
                    {s.name}
                  </b>
                  {families.map((f) => (
                    <SelectField
                      key={f}
                      label={`${f} de ${s.name}`}
                      hideLabel
                      disabled={pending}
                      className="min-w-36"
                      options={[
                        { value: NONE, label: `${f} : aucun` },
                        ...groups
                          .filter((g) => g.family === f)
                          .map((g) => ({
                            value: g.id,
                            label: `${f} : ${g.name}`,
                          })),
                      ]}
                      value={s.groups[f] ?? NONE}
                      onValueChange={(v) => assign(s.id, f, v)}
                    />
                  ))}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function AddGroups({
  classId,
  className,
  families,
}: {
  classId: string;
  className: string;
  families: string[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [family, setFamily] = useState(
    families.includes("Demi-groupe") ? "" : "Demi-groupe",
  );
  const [names, setNames] = useState(
    families.includes("Demi-groupe") ? "" : "G1, G2",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={`Créer des groupes · ${className}`}
      description="Une famille regroupe des groupes exclusifs : un élève est dans un seul groupe par famille (par exemple LV2 : Espagnol, Allemand)."
      trigger={
        <Button icon="add" variant="secondary" className="h-10 px-4 text-label">
          Créer des groupes
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const list = names
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean);
          if (!family.trim()) return setError("Nommez la famille de groupes.");
          if (!list.length) return setError("Indiquez au moins un groupe.");
          setError(null);
          start(async () => {
            const r = await createClassGroups(classId, family.trim(), list);
            if (!r.ok) return setError(r.error ?? "");
            toast({ title: "Groupes créés" });
            setOpen(false);
            router.refresh();
          });
        }}
      >
        <TextField
          label="Famille"
          hint="Par exemple : Demi-groupe, LV2, LV3, Option."
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          maxLength={30}
          required
        />
        <TextField
          label="Groupes, séparés par des virgules"
          hint="Par exemple : G1, G2 ou Espagnol, Allemand."
          value={names}
          onChange={(e) => setNames(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="m-0 text-label text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 px-4 text-label">
            {pending ? "Création…" : "Créer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
