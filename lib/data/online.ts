import "server-only";
import { CATALOG } from "@/lib/apps";
import type { Viewer } from "@/lib/session";
import type { SupabaseServer } from "@/lib/supabase/server";
import { classStudents } from "./common";
import { getPublishTargets } from "./targets";

export type LinkKind = "meet" | "duolingo" | "kahoot" | "autre";
export type ClassLink = { id: string; kind: LinkKind; label: string; url: string | null; code: string | null };
export type OnlineClass = {
  id: string;
  name: string;
  editable: boolean;
  links: ClassLink[];
  /** Classes tenues par la personne : élèves et identifiants d'applis déjà donnés (appli → élève → identifiant). */
  students?: { id: string; name: string }[];
  logins?: Record<string, Record<string, string>>;
};

const ORDER: LinkKind[] = ["meet", "kahoot", "duolingo", "autre"];

/** Mes classes en ligne : les classes de la personne (ses enfants, ses élèves…), avec leurs liens et codes. */
export async function getOnlineClasses(supabase: SupabaseServer, viewer: Viewer): Promise<OnlineClass[]> {
  const targets = viewer.staff ? await getPublishTargets(supabase, viewer) : null;
  const followed = viewer.student
    ? [viewer.student, ...viewer.children.filter((c) => c.id !== viewer.student!.id)]
    : viewer.children;
  const classIds = [...new Set([...(targets?.classes ?? []).map((c) => c.id), ...followed.flatMap((s) => s.classIds)])];
  if (!classIds.length) return [];
  const [{ data: classes }, { data: links }] = await Promise.all([
    supabase.from("classes").select("id, name").in("id", classIds).eq("hidden", false).order("name"),
    supabase
      .from("class_links")
      .select("id, class_id, kind, label, url, code, updated_at")
      .in("class_id", classIds)
      .order("updated_at", { ascending: false }),
  ]);
  const editable = new Set((targets?.classes ?? []).map((c) => c.id));
  const rosters = new Map(
    await Promise.all(
      (classes ?? []).filter((c) => editable.has(c.id)).map(async (c) => [c.id, await classStudents(supabase, c.id)] as const),
    ),
  );
  const pupilIds = [...new Set([...rosters.values()].flat().map((s) => s.id))];
  const { data: given } = pupilIds.length
    ? await supabase.from("student_app_logins").select("student_id, app_key, login").in("student_id", pupilIds)
    : { data: [] as { student_id: string; app_key: string; login: string }[] };
  return (classes ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    editable: editable.has(c.id),
    links: (links ?? [])
      .filter((l) => l.class_id === c.id)
      .map((l) => ({ id: l.id, kind: l.kind as LinkKind, label: l.label, url: l.url, code: l.code }))
      .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind)),
    ...(rosters.has(c.id)
      ? (() => {
          const students = rosters.get(c.id)!.map((s) => ({ id: s.id, name: s.name }));
          const ids = new Set(students.map((s) => s.id));
          const logins: Record<string, Record<string, string>> = {};
          for (const g of given ?? []) {
            if (!ids.has(g.student_id) || !g.login) continue;
            (logins[g.app_key] ??= {})[g.student_id] = g.login;
          }
          return { students, logins };
        })()
      : {}),
  }));
}

export type MyApp = {
  /** Clé du catalogue, ou identifiant de la ligne pour une appli ajoutée. */
  key: string;
  rowId: string | null;
  custom: boolean;
  name: string;
  description: string;
  category: string;
  url: string;
  loginUrl: string | null;
  sso: string | null;
  loginHint: string;
  login: string;
  hidden: boolean;
  /** Identifiant donné par l'établissement (à l'élève, ou à chaque enfant pour un responsable). */
  given: { who: string | null; login: string }[];
};

/** Mes applis : le catalogue, les applis ajoutées par la personne, et l'identifiant retenu pour chacune. */
export async function getMyApps(supabase: SupabaseServer, viewer?: Viewer): Promise<MyApp[]> {
  const followed = viewer ? (viewer.student ? [viewer.student, ...viewer.children] : viewer.children) : [];
  const pupils = [...new Map(followed.map((s) => [s.id, s])).values()];
  const [{ data }, { data: given }] = await Promise.all([
    supabase.from("my_apps").select("id, app_key, name, url, login, hidden").order("created_at"),
    pupils.length
      ? supabase.from("student_app_logins").select("student_id, app_key, login").in("student_id", pupils.map((p) => p.id))
      : Promise.resolve({ data: [] as { student_id: string; app_key: string; login: string }[] }),
  ]);
  const self = viewer?.id !== "parent" && viewer?.id !== "parent-primaire";
  const givenFor = (key: string) =>
    (given ?? [])
      .filter((g) => g.app_key === key && g.login)
      .map((g) => ({ who: self ? null : (pupils.find((p) => p.id === g.student_id)?.firstName ?? null), login: g.login }));
  const rows = data ?? [];
  const byKey = new Map(rows.filter((r) => r.app_key).map((r) => [r.app_key!, r]));
  const catalog: MyApp[] = CATALOG.map((a) => {
    const r = byKey.get(a.key);
    return {
      key: a.key,
      rowId: r?.id ?? null,
      custom: false,
      name: a.name,
      description: a.description,
      category: a.category,
      url: a.url,
      loginUrl: a.loginUrl ?? null,
      sso: a.sso ?? null,
      loginHint: a.loginHint,
      login: r?.login ?? "",
      hidden: r?.hidden ?? false,
      given: givenFor(a.key),
    };
  });
  const custom: MyApp[] = rows
    .filter((r) => !r.app_key && r.name && r.url)
    .map((r) => ({
      key: r.id,
      rowId: r.id,
      custom: true,
      name: r.name!,
      description: new URL(r.url!).hostname.replace(/^www\./, ""),
      category: "Mes ajouts",
      url: r.url!,
      loginUrl: null,
      sso: null,
      loginHint: "Identifiant",
      login: r.login ?? "",
      hidden: r.hidden,
      given: [],
    }));
  return [...custom, ...catalog];
}
