"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { SelectField } from "@/components/ui/field";
import { SegmentedTabs } from "@/components/ui/segmented";
import type { DrawClass } from "@/lib/data/tools";

const shuffle = <T,>(list: T[]) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Élèves concernés : la classe ou un de ses groupes, sans les absents cochés. */
function usePool(classes: DrawClass[]) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [groupId, setGroupId] = useState("classe");
  const [absent, setAbsent] = useState<string[]>([]);
  const klass = classes.find((c) => c.id === classId) ?? classes[0];
  const group = klass?.groups.find((g) => g.id === groupId);
  const everyone = (klass?.students ?? []).filter((s) => !group || group.members.includes(s.id));
  const pool = everyone.filter((s) => !absent.includes(s.id));
  return { klass, classId, setClassId, groupId, setGroupId, everyone, pool, absent, setAbsent };
}

function PoolPicker({ classes, p }: { classes: DrawClass[]; p: ReturnType<typeof usePool> }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="flex flex-wrap gap-3">
        <SelectField
          label="Classe"
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          value={p.klass?.id}
          onValueChange={(v) => {
            p.setClassId(v);
            p.setGroupId("classe");
            p.setAbsent([]);
          }}
          className="min-w-40"
        />
        {p.klass && p.klass.groups.length > 0 && (
          <SelectField
            label="Élèves"
            options={[{ value: "classe", label: "Toute la classe" }, ...p.klass.groups.map((g) => ({ value: g.id, label: g.name }))]}
            value={p.groupId}
            onValueChange={p.setGroupId}
            className="min-w-40"
          />
        )}
      </div>
      <details>
        <summary className="cursor-pointer text-label font-bold">
          Absents à exclure ({p.absent.filter((id) => p.everyone.some((s) => s.id === id)).length})
        </summary>
        <ul className="m-0 mt-2 grid list-none gap-1 p-0 sm:grid-cols-2">
          {p.everyone.map((s) => (
            <li key={s.id}>
              <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-label">
                <Checkbox
                  checked={p.absent.includes(s.id)}
                  onCheckedChange={(c) => p.setAbsent((a) => (c ? [...a, s.id] : a.filter((x) => x !== s.id)))}
                />
                {s.name}
              </label>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Draw({ classes }: { classes: DrawClass[] }) {
  const p = usePool(classes);
  const [noRepeat, setNoRepeat] = useState(true);
  const [drawn, setDrawn] = useState<string[]>([]);
  const [shown, setShown] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const left = p.pool.filter((s) => !noRepeat || !drawn.includes(s.id));
  const nameOf = (id: string) => p.klass?.students.find((s) => s.id === id)?.name ?? "";

  const roll = () => {
    if (!left.length) return;
    setRolling(true);
    let n = 0;
    const timer = setInterval(() => {
      setShown(left[Math.floor(Math.random() * left.length)].id);
      if (++n >= 12) {
        clearInterval(timer);
        const pick = left[Math.floor(Math.random() * left.length)].id;
        setShown(pick);
        setDrawn((d) => [...d, pick]);
        setRolling(false);
      }
    }, 70);
  };

  return (
    <div className="flex flex-col gap-4">
      <PoolPicker classes={classes} p={p} />
      <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface px-5 py-10 text-center">
        <p aria-live="polite" className="m-0 min-h-16 font-display text-[clamp(2rem,6vw,3.5rem)] leading-tight font-bold">
          {shown ? nameOf(shown) : "?"}
        </p>
        <Button icon="casino" className="h-12 px-6" disabled={rolling || !left.length} onClick={roll}>
          {left.length ? "Tirer au sort" : "Tout le monde est passé"}
        </Button>
        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-label">
          <Checkbox checked={noRepeat} onCheckedChange={setNoRepeat} />
          Ne pas retirer un élève déjà passé ({left.length} restant{left.length > 1 ? "s" : ""})
        </label>
        {drawn.length > 0 && (
          <Button variant="secondary" icon="replay" className="h-10 px-4 text-label" onClick={() => (setDrawn([]), setShown(null))}>
            Recommencer
          </Button>
        )}
      </div>
    </div>
  );
}

function Groups({ classes }: { classes: DrawClass[] }) {
  const p = usePool(classes);
  const [mode, setMode] = useState<"nombre" | "taille">("nombre");
  const [n, setN] = useState("4");
  const [teams, setTeams] = useState<string[][]>([]);
  const nameOf = (id: string) => p.klass?.students.find((s) => s.id === id)?.name ?? "";
  const make = () => {
    const ids = shuffle(p.pool.map((s) => s.id));
    const k = Math.max(1, Number(n));
    const count = mode === "nombre" ? Math.min(k, ids.length) : Math.max(1, Math.ceil(ids.length / k));
    const out: string[][] = Array.from({ length: count }, () => []);
    ids.forEach((id, i) => out[i % count].push(id));
    setTeams(out);
  };
  return (
    <div className="flex flex-col gap-4">
      <PoolPicker classes={classes} p={p} />
      <div className="flex flex-wrap items-end gap-3 rounded-card border border-line bg-surface p-4">
        <SelectField
          label="Faire"
          options={[
            { value: "nombre", label: "un nombre de groupes" },
            { value: "taille", label: "des groupes de" },
          ]}
          value={mode}
          onValueChange={(v) => setMode(v as "nombre" | "taille")}
          className="min-w-48"
        />
        <SelectField
          label={mode === "nombre" ? "Groupes" : "Élèves par groupe"}
          options={["2", "3", "4", "5", "6", "7", "8"].map((v) => ({ value: v, label: v }))}
          value={n}
          onValueChange={setN}
          className="min-w-28"
        />
        <Button icon="groups" className="h-12 px-5" disabled={!p.pool.length} onClick={make}>
          {teams.length ? "Refaire les groupes" : "Faire les groupes"}
        </Button>
      </div>
      {teams.length > 0 && (
        <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((t, i) => (
            <li key={i} className="rounded-card border border-line bg-surface p-4">
              <b className="font-display text-h3">Groupe {i + 1}</b>
              <ul className="m-0 mt-2 list-none p-0 text-ui">
                {t.map((id) => (
                  <li key={id} className="py-0.5">
                    {nameOf(id)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Timer() {
  const [total, setTotal] = useState(300);
  const [left, setLeft] = useState(300);
  const [running, setRunning] = useState(false);
  const end = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const ms = Math.max(0, end.current - Date.now());
      setLeft(Math.ceil(ms / 1000));
      if (ms <= 0) setRunning(false);
    }, 200);
    return () => clearInterval(t);
  }, [running]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const presets = useMemo(() => [1, 2, 3, 5, 10, 15, 20], []);
  return (
    <div ref={box} className="flex flex-col items-center gap-5 rounded-card border border-line bg-surface px-5 py-10">
      <p
        role="timer"
        aria-label={`${Math.floor(left / 60)} minutes ${left % 60} secondes`}
        className={`m-0 font-display text-[clamp(4rem,18vw,12rem)] leading-none font-bold tabular ${left === 0 ? "text-danger" : ""}`}
      >
        {mm}:{ss}
      </p>
      {left === 0 && <p role="alert" className="m-0 text-h3 font-bold text-danger">Temps écoulé !</p>}
      <div className="flex flex-wrap justify-center gap-2">
        {presets.map((m) => (
          <Button
            key={m}
            variant="secondary"
            className="h-10 px-3.5 text-label"
            aria-pressed={total === m * 60}
            onClick={() => {
              setRunning(false);
              setTotal(m * 60);
              setLeft(m * 60);
            }}
          >
            {m} min
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          icon={running ? "pause" : "play_arrow"}
          className="h-12 px-6"
          disabled={left === 0}
          onClick={() => {
            if (running) return setRunning(false);
            end.current = Date.now() + left * 1000;
            setRunning(true);
          }}
        >
          {running ? "Pause" : "Démarrer"}
        </Button>
        <Button variant="secondary" icon="replay" className="h-12 px-5" onClick={() => (setRunning(false), setLeft(total))}>
          Remettre à zéro
        </Button>
        <Button variant="secondary" className="h-12 px-5" onClick={() => box.current?.requestFullscreen?.()}>
          Plein écran
        </Button>
      </div>
    </div>
  );
}

/** Tirage au sort, groupes et minuteur, à partir des vraies listes de classe. */
export function TirageScreen({ classes }: { classes: DrawClass[] }) {
  if (!classes.length)
    return (
      <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
        Aucune classe avec des élèves pour l&apos;instant.
      </p>
    );
  return (
    <SegmentedTabs
      aria-label="Outil"
      defaultValue="tirage"
      tabs={[
        { value: "tirage", label: "Tirage au sort", content: <Draw classes={classes} /> },
        { value: "groupes", label: "Groupes", content: <Groups classes={classes} /> },
        { value: "minuteur", label: "Minuteur", content: <Timer /> },
      ]}
    />
  );
}
