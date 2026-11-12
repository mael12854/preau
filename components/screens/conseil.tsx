"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  saveReportCouncil,
  saveReportLine,
  saveReportScore,
  setCouncilParticipant,
  setCouncilStatus,
} from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { SegmentedTabs } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { COUNCIL_ROLES, MENTIONS, type CouncilRole } from "@/lib/councils";
import type { CouncilDetail, CouncilSheet } from "@/lib/data/councils";
import { EVAL_LEVELS, evalText, type EvalLevel } from "@/lib/evaluation";
import { formatDateShort, formatTimeText } from "@/lib/format";
import { formatScore, parseScore } from "@/lib/grading";
import { STATUS_LABEL } from "./conseils";

const fmt = (n: number | null | undefined) => (n === null || n === undefined ? "—" : formatScore(Math.round(Number(n) * 100) / 100));

/** Moyenne générale : moyenne des moyennes de matière (note retenue, sinon moyenne des évaluations). */
function generalAverage(sheet: CouncilSheet) {
  const values = sheet.subjects.map((s) => s.score ?? s.average).filter((v): v is number => v !== null && v !== undefined).map(Number);
  return values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : null;
}

// ── Préparation : chaque professeur, ses matières, une appréciation par élève ──
function LineEditor({
  sheet,
  subjectId,
  grading,
  editable,
}: {
  sheet: CouncilSheet;
  subjectId: string;
  grading: "competences" | "note20";
  editable: boolean;
}) {
  const toast = useToast();
  const line = sheet.subjects.find((s) => s.subject_id === subjectId);
  const [comment, setComment] = useState(line?.comment ?? "");
  const [score, setScore] = useState(line?.score !== null && line?.score !== undefined ? formatScore(Number(line.score)) : "");
  const [currentLevel, setLevel] = useState<string>(line?.level && line.level !== "NE" ? line.level : "aucun");
  const [saved, setSaved] = useState({ comment: line?.comment ?? "", score, level: currentLevel });
  const [, start] = useTransition();
  const save = (override?: { level?: string }) => {
    const level = override?.level ?? currentLevel;
    if (comment === saved.comment && score === saved.score && level === saved.level) return;
    start(async () => {
      if (grading === "note20" && score !== saved.score) {
        const value = parseScore(score);
        if (value === undefined) return toast({ title: "Note entre 0 et 20, au demi-point." });
        const r = await saveReportScore(sheet.report_card_id, subjectId, value);
        if (!r.ok) return toast({ title: r.error });
      }
      if (comment !== saved.comment || level !== saved.level) {
        const r = await saveReportLine(sheet.report_card_id, subjectId, level === "aucun" ? null : (level as EvalLevel), comment);
        if (!r.ok) return toast({ title: r.error });
      }
      setSaved({ comment, score, level });
      toast({ title: `${sheet.name} : enregistré` });
    });
  };
  return (
    <li className="flex flex-col gap-2 border-b border-line-soft px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <b className="text-ui">{sheet.name}</b>
        <span className="text-caption text-ink-muted">
          Évaluations : {line?.results.length ? line.results.join(" · ") : "aucune"}
          {grading === "note20" && <> · moyenne {fmt(line?.average)}</>}
        </span>
      </div>
      {grading === "note20" ? (
        <label className="flex items-center gap-2 text-label">
          Moyenne retenue
          <input
            inputMode="decimal"
            value={score}
            disabled={!editable}
            placeholder={line?.average !== null && line?.average !== undefined ? fmt(line.average) : "—"}
            onChange={(e) => setScore(e.target.value)}
            onBlur={() => save()}
            className="h-10 w-20 rounded-control border border-line bg-surface px-2 text-right text-ui tabular disabled:bg-neutral-bg"
          />
          <span className="text-caption text-ink-muted">sur 20 · vide : la moyenne des évaluations</span>
        </label>
      ) : (
        <SelectField
          label="Positionnement"
          options={[{ value: "aucun", label: "Non positionné" }, ...EVAL_LEVELS.map((l) => ({ value: l, label: evalText(l, "college").label }))]}
          value={currentLevel}
          onValueChange={(v) => {
            setLevel(v);
            save({ level: v });
          }}
          disabled={!editable}
          className="max-w-xs"
        />
      )}
      <TextAreaField
        label="Appréciation"
        hideLabel
        placeholder="Appréciation"
        rows={2}
        value={comment}
        maxLength={1000}
        disabled={!editable}
        onChange={(e) => setComment(e.target.value)}
        onBlur={() => save()}
      />
    </li>
  );
}

function Preparation({ council }: { council: CouncilDetail }) {
  const [subject, setSubject] = useState(council.mySubjects[0]?.id ?? "");
  if (!council.mySubjects.length)
    return <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">Aucune matière à remplir pour vous dans cette classe.</p>;
  return (
    <div className="flex flex-col gap-3">
      {!council.canEditLines && (
        <p className="m-0 rounded-card border border-line bg-surface px-4 py-3 text-label text-ink-2">
          Les appréciations sont figées depuis le début du conseil.
        </p>
      )}
      <SelectField
        label="Matière"
        options={council.mySubjects.map((s) => ({ value: s.id, label: s.name }))}
        value={subject}
        onValueChange={setSubject}
        className="max-w-xs"
      />
      <ul className="m-0 list-none overflow-hidden rounded-card border border-line bg-surface p-0">
        {council.sheets.map((s) => (
          <LineEditor key={`${subject}-${s.student_id}`} sheet={s} subjectId={subject} grading={council.grading} editable={council.canEditLines} />
        ))}
      </ul>
    </div>
  );
}

// ── Conseil : une fiche par élève ──
function StudentSheet({ council, sheet }: { council: CouncilDetail; sheet: CouncilSheet }) {
  const toast = useToast();
  const [mention, setMention] = useState(sheet.mention ?? "aucune");
  const [text, setText] = useState(sheet.council_text ?? "");
  const [pending, start] = useTransition();
  const general = generalAverage(sheet);
  return (
    <article className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 sm:p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 font-display text-h2 font-bold">{sheet.name}</h2>
        {council.grading === "note20" && (
          <span className="text-ui">
            Moyenne générale : <b className="tabular">{fmt(general)}</b>
          </span>
        )}
      </header>
      <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0 text-center">
        <li className="rounded-control bg-surface-2 px-2 py-2">
          <b className="block font-display text-h3">{sheet.absences}</b>
          <span className="text-caption text-ink-2">absence{sheet.absences > 1 ? "s" : ""}</span>
        </li>
        <li className="rounded-control bg-surface-2 px-2 py-2">
          <b className={`block font-display text-h3 ${sheet.absences_unjustified ? "text-danger" : ""}`}>{sheet.absences_unjustified}</b>
          <span className="text-caption text-ink-2">non justifiée{sheet.absences_unjustified > 1 ? "s" : ""}</span>
        </li>
        <li className="rounded-control bg-surface-2 px-2 py-2">
          <b className="block font-display text-h3">{sheet.lates}</b>
          <span className="text-caption text-ink-2">retard{sheet.lates > 1 ? "s" : ""}</span>
        </li>
      </ul>
      <ul className="m-0 flex list-none flex-col p-0">
        {sheet.subjects.map((s) => (
          <li key={s.subject_id} className="flex flex-col gap-1 border-b border-line-soft py-2.5 last:border-b-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <b className="text-label">{s.subject}</b>
              <span className="text-label tabular">
                {council.grading === "note20" ? (
                  <>
                    {fmt(s.score ?? s.average)}
                    {s.score !== null && s.average !== null && Number(s.score) !== Number(s.average) && (
                      <span className="text-caption text-ink-muted"> (évaluations : {fmt(s.average)})</span>
                    )}
                  </>
                ) : s.level && s.level !== "NE" ? (
                  evalText(s.level as EvalLevel, "college").label
                ) : (
                  "—"
                )}
              </span>
            </div>
            {s.results.length > 0 && <span className="text-caption text-ink-muted">Évaluations : {s.results.join(" · ")}</span>}
            <p className="m-0 text-label text-ink-2">{s.comment || <span className="text-ink-muted">Pas d&apos;appréciation.</span>}</p>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-col gap-3 border-t border-line pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await saveReportCouncil(sheet.report_card_id, mention === "aucune" ? "" : mention, text);
            toast({ title: r.ok ? `Avis du conseil enregistré pour ${sheet.name}` : r.error });
          });
        }}
      >
        <SelectField
          label="Mention"
          options={[{ value: "aucune", label: "Aucune mention" }, ...MENTIONS.map((m) => ({ value: m, label: m }))]}
          value={mention}
          onValueChange={setMention}
          disabled={!council.canAdvise}
          className="max-w-sm"
        />
        <TextAreaField label="Appréciation générale" rows={3} value={text} maxLength={1000} disabled={!council.canAdvise} onChange={(e) => setText(e.target.value)} />
        {council.canAdvise && (
          <Button type="submit" disabled={pending} className="h-10 w-fit px-4 text-label">
            {pending ? "Enregistrement…" : "Enregistrer l'avis"}
          </Button>
        )}
      </form>
    </article>
  );
}

function Council({ council }: { council: CouncilDetail }) {
  const [index, setIndex] = useState(0);
  if (!council.sheets.length)
    return <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">Aucun élève dans cette classe.</p>;
  const sheet = council.sheets[Math.min(index, council.sheets.length - 1)];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <Button variant="secondary" className="h-11 px-3 text-label" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          ← Précédent
        </Button>
        <SelectField
          label="Élève"
          hideLabel
          options={council.sheets.map((s, i) => ({ value: String(i), label: `${i + 1}. ${s.name}` }))}
          value={String(index)}
          onValueChange={(v) => setIndex(Number(v))}
          className="min-w-48 flex-1"
        />
        <Button
          variant="secondary"
          className="h-11 px-3 text-label"
          disabled={index >= council.sheets.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          Suivant →
        </Button>
      </div>
      {!council.canAdvise && council.status !== "cloture" && (
        <p className="m-0 text-caption text-ink-muted">
          {council.status === "preparation"
            ? "L'avis du conseil se rédige une fois le conseil commencé."
            : "Seuls la direction et le professeur principal rédigent l'avis."}
        </p>
      )}
      <StudentSheet key={sheet.report_card_id} council={council} sheet={sheet} />
    </div>
  );
}

function Participants({ council }: { council: CouncilDetail }) {
  const toast = useToast();
  const router = useRouter();
  const [person, setPerson] = useState<string>();
  const [role, setRole] = useState<CouncilRole>("delegue_eleve");
  const [pending, start] = useTransition();
  const admin = council.people.length > 0;
  return (
    <div className="flex flex-col gap-3">
      <ul className="m-0 list-none overflow-hidden rounded-card border border-line bg-surface p-0">
        {council.participants.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 border-b border-line-soft px-4 py-3 last:border-b-0">
            <span className="text-ui">{p.name}</span>
            <Badge tone={p.role === "prof_principal" || p.role === "direction" ? "info" : "neutral"}>{COUNCIL_ROLES[p.role]}</Badge>
          </li>
        ))}
      </ul>
      {admin && council.status !== "cloture" && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-card border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!person) return;
            start(async () => {
              const r = await setCouncilParticipant(council.id, person, role);
              toast({ title: r.ok ? "Participant ajouté" : r.error });
              if (r.ok) router.refresh();
            });
          }}
        >
          <SelectField
            label="Personne"
            placeholder="Choisir"
            options={council.people.map((p) => ({ value: p.id, label: p.name }))}
            value={person}
            onValueChange={setPerson}
            className="min-w-56 flex-1"
          />
          <SelectField
            label="Rôle"
            options={Object.entries(COUNCIL_ROLES).map(([value, label]) => ({ value, label }))}
            value={role}
            onValueChange={(v) => setRole(v as CouncilRole)}
            className="min-w-44"
          />
          <Button type="submit" disabled={pending || !person} className="h-12 px-4 text-label">
            Ajouter
          </Button>
        </form>
      )}
      <p className="m-0 text-caption text-ink-muted">Les délégués participent au conseil mais ne voient pas les fiches des élèves dans Préau.</p>
    </div>
  );
}

/** Un conseil de classe : préparation (appréciations), conseil (fiches élèves, avis, mention), participants, étapes. */
export function CouncilScreen({ council }: { council: CouncilDetail }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const next =
    council.status === "preparation"
      ? { to: "en_cours" as const, label: "Démarrer le conseil", confirm: "Démarrer le conseil ? Les appréciations des professeurs seront figées." }
      : council.status === "en_cours"
        ? {
            to: "cloture" as const,
            label: "Clôturer et publier les bulletins",
            confirm: "Clôturer le conseil ? Les bulletins deviennent visibles par les élèves et leurs familles, et plus rien ne pourra être modifié.",
          }
        : null;
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4">
        <div className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <b className="font-display text-h2">{council.className}</b>
            <Badge tone={STATUS_LABEL[council.status].tone}>{STATUS_LABEL[council.status].label}</Badge>
          </span>
          <span className="text-label text-ink-2">
            Trimestre {council.term} · {formatDateShort(council.heldAt)} à {formatTimeText(council.heldAt)} · période du{" "}
            {formatDateShort(council.periodStart)} au {formatDateShort(council.periodEnd)}
            {council.headTeacher && ` · PP : ${council.headTeacher}`}
          </span>
        </div>
        {council.canManage && next && (
          <Button
            className="h-11 px-4 text-label"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(next.confirm)) return;
              start(async () => {
                const r = await setCouncilStatus(council.id, next.to);
                toast({ title: r.ok ? (next.to === "cloture" ? "Conseil clôturé : bulletins publiés" : "Conseil commencé") : r.error });
                if (r.ok) router.refresh();
              });
            }}
          >
            {next.label}
          </Button>
        )}
      </section>
      <SegmentedTabs
        aria-label="Conseil de classe"
        defaultValue={council.status === "preparation" ? "preparation" : "conseil"}
        tabs={[
          { value: "preparation", label: "Préparation", content: <Preparation council={council} /> },
          { value: "conseil", label: "Fiches élèves", content: <Council council={council} /> },
          { value: "participants", label: "Participants", content: <Participants council={council} /> },
        ]}
      />
    </div>
  );
}
