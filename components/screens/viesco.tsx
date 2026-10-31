"use client";

import { useState } from "react";
import { Badge, TONE_CLASSES } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { LifeEventView, LifeStatsView } from "@/lib/data/types";
import { Stat } from "./greeting";
import { SelectField } from "@/components/ui/field";
import { JustifyButton, RequestButton, ReviewButtons } from "./justify-dialog";

/** Vie scolaire : 4 compteurs, événements avec statut et « Justifier ». */
const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

export function VieScolaireScreen({
  events: all,
  stats,
  staff = false,
  canValidate = false,
}: {
  events: LifeEventView[];
  stats: LifeStatsView;
  /** Personnel : filtres par classe et « à traiter ». */
  staff?: boolean;
  /** Vie scolaire, direction, secrétariat : justification validée tout de suite. */
  canValidate?: boolean;
}) {
  const [klass, setKlass] = useState("toutes");
  const [who, setWho] = useState("tous");
  const [show, setShow] = useState<"tout" | "a-traiter" | "absences">(staff ? "a-traiter" : "tout");
  const classes = [...new Set(all.map((e) => e.className).filter(Boolean))] as string[];
  const pupils = [...new Map(all.filter((e) => e.student).map((e) => [e.studentId, e.student!])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1], "fr"),
  );
  const pupilToJustify = who === "tous" ? 0 : all.filter((e) => e.studentId === who && e.status === "À justifier").length;
  const events = all.filter(
    (e) =>
      (klass === "toutes" || e.className === klass) &&
      (who === "tous" || e.studentId === who) &&
      (show === "tout" || (show === "a-traiter" ? e.pending : e.kind === "absence" || e.kind === "retard")),
  );
  const SCHOOL_LIFE_STATS = [
    { value: String(stats.absences), label: `${plural(stats.absences, "Absence", "Absences")}${stats.toJustify ? ` · ${stats.toJustify} à justifier` : ""}` },
    { value: String(stats.lates), label: `${plural(stats.lates, "Retard", "Retards")}${stats.lateMinutes ? ` · ${stats.lateMinutes} min au total` : ""}` },
    { value: String(stats.sanctions), label: plural(stats.sanctions, "Sanction", "Sanctions") },
    { value: String(stats.encouragements), label: plural(stats.encouragements, "Encouragement", "Encouragements"), positive: stats.encouragements > 0 },
  ];
  return (
    <div className="flex flex-col gap-5">
      <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 lg:grid-cols-4">
        {SCHOOL_LIFE_STATS.map((s) => (
          <li key={s.label} className="flex flex-col rounded-card border border-line bg-surface p-[1.125rem]">
            <Stat value={s.value} label={s.label} tone={s.positive ? "ok" : undefined} />
          </li>
        ))}
      </ul>
      {staff && (
        <div className="flex flex-wrap gap-3">
          {classes.length > 1 && (
            <SelectField
              label="Classe"
              options={[{ value: "toutes", label: "Toutes les classes" }, ...classes.sort().map((c) => ({ value: c, label: c }))]}
              value={klass}
              onValueChange={setKlass}
              className="min-w-44"
            />
          )}
          {pupils.length > 1 && (
            <SelectField
              label="Élève"
              options={[{ value: "tous", label: "Tous les élèves" }, ...pupils.map(([id, name]) => ({ value: id, label: name }))]}
              value={who}
              onValueChange={setWho}
              className="min-w-48"
            />
          )}
          <SelectField
            label="Afficher"
            options={[
              { value: "a-traiter", label: "À traiter (à justifier, justificatifs reçus)" },
              { value: "absences", label: "Absences et retards" },
              { value: "tout", label: "Tout" },
            ]}
            value={show}
            onValueChange={(v) => setShow(v as typeof show)}
            className="min-w-64"
          />
          {who !== "tous" && pupilToJustify > 0 && (
            <div className="flex items-end">
              <RequestButton
                studentId={who}
                variant="primary"
                label={`Demander les ${pupilToJustify} justificatif${pupilToJustify > 1 ? "s" : ""}`}
                what={`${pupils.find(([id]) => id === who)?.[1] ?? ""} · toutes ses absences et retards à justifier`}
              />
            </div>
          )}
        </div>
      )}
      <section aria-labelledby="viesco-events" className="@container overflow-hidden rounded-card border border-line bg-surface">
        <h2 id="viesco-events" className="sr-only">
          Événements
        </h2>
        {events.length === 0 && (
          <p className="m-0 px-5 py-10 text-center text-ui text-ink-2">
            {staff && show === "a-traiter" ? "Rien à traiter : toutes les absences sont justifiées." : "Aucun événement pour l'instant."}
          </p>
        )}
        <ul className="m-0 list-none p-0">
          {events.map((e) => {
            return (
              <li
                key={e.id}
                className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-b border-line-soft px-5 py-4 last:border-b-0 @3xl:grid-cols-[2.75rem_10rem_minmax(0,1fr)_8.125rem_auto]"
              >
                <span aria-hidden="true" className={cn("flex size-10 items-center justify-center rounded-control", TONE_CLASSES[e.tone])}>
                  <Icon name={e.icon} size={22} />
                </span>
                <div className="flex flex-col">
                  <h3 className="m-0 text-ui font-bold">
                    {e.type}
                    {e.student && <span className="font-normal text-ink-2"> · {e.student}</span>}
                  </h3>
                  {e.className && staff && <span className="text-caption text-ink-muted">{e.className}</span>}
                  <span className="text-caption text-ink-muted">{e.date}</span>
                </div>
                <span className="col-start-2 flex flex-col text-ui text-ink-2 @3xl:col-start-auto">
                  {e.detail}
                  {e.reason && <span className="text-caption text-ink-muted">Motif : {e.reason}{e.comment ? ` · ${e.comment}` : ""}</span>}
                  {e.reviewComment && e.status === "À justifier" && (
                    <span className="text-caption text-danger">Justificatif refusé : {e.reviewComment}</span>
                  )}
                </span>
                <div className="col-start-2 @3xl:col-start-auto">
                  <Badge tone={e.statusTone}>{e.status}</Badge>
                </div>
                <div className="col-start-2 @3xl:col-start-auto">
                  <span className="flex flex-wrap gap-2">
                    {e.canReview && <ReviewButtons eventId={e.id} what={`${e.type} · ${e.student ?? ""} · ${e.date}`} reason={e.reason} comment={e.comment} />}
                    {staff && (e.kind === "absence" || e.kind === "retard") && e.status !== "Justificatif envoyé" && (
                      <RequestButton eventId={e.id} what={`${e.type} · ${e.student ?? ""} · ${e.date} · ${e.detail}`} />
                    )}
                    {e.canJustify && !e.canReview && (
                      <JustifyButton eventId={e.id} what={`${e.type} · ${e.date}`} staff={canValidate} late={e.kind === "retard"} />
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
