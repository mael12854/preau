"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DOCUMENT_TYPES, storage } from "@/lib/documents";
import { notifyNewMessage } from "@/lib/email";
import { createCheckout } from "@/lib/payments";
import type { EvalValue } from "@/lib/evaluation";
import { CHILD_COOKIE, getViewer } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACT_AS_COOKIE, createClient, PROFILE_COOKIE } from "@/lib/supabase/server";

/** Résultat d'une action : message lisible en cas d'échec (jamais de code d'erreur brut). */
export type ActionResult = { ok: true } | { ok: false; error: string };

const FAILED = "L'enregistrement n'a pas abouti. Réessayez dans un instant.";

async function run(
  fn: (
    supabase: Awaited<ReturnType<typeof createClient>>,
  ) => PromiseLike<{ error: { message: string } | null }>,
  paths: string[],
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await fn(supabase);
  if (error) {
    // Les messages des fonctions SQL sont rédigés pour l'utilisateur ; les autres restent génériques.
    const readable =
      /^[A-ZÉÈ][^:]*\.?$/.test(error.message) &&
      !/permission|violates|syntax/i.test(error.message);
    return { ok: false, error: readable ? error.message : FAILED };
  }
  paths.forEach((p) => revalidatePath(p));
  return { ok: true };
}

/** Devoirs : donner un devoir ou annoncer un contrôle (enseignant de la classe). */
export async function giveHomework(h: {
  classId: string;
  subjectId: string;
  content: string;
  due: string;
  exam: boolean;
}): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("give_homework", {
        p_class: h.classId,
        p_subject: h.subjectId,
        p_content: h.content,
        p_due: h.due,
        p_is_exam: h.exam,
      }),
    ["/devoirs", "/accueil"],
  );
}

/** Devoirs : modifier un devoir qu'on a donné. */
export async function updateHomework(
  id: string,
  h: { content: string; due: string; exam: boolean },
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("update_homework", {
        p_id: id,
        p_content: h.content,
        p_due: h.due,
        p_is_exam: h.exam,
      }),
    ["/devoirs", "/accueil"],
  );
}

/** Devoirs : retirer un devoir qu'on a donné. */
export async function removeHomework(id: string): Promise<ActionResult> {
  return run((s) => s.rpc("remove_homework", { p_id: id }), [
    "/devoirs",
    "/accueil",
  ]);
}

/** Fiche au nom de laquelle agir : celle de la section cliquée dans l'espace « Général », sinon la fiche active. */
async function actingProfileId(viewer: { profileId: string; general: string[] | null }) {
  if (!viewer.general) return viewer.profileId;
  const id = (await cookies()).get(ACT_AS_COOKIE)?.value;
  return id && viewer.general.includes(id) ? id : viewer.profileId;
}

/** Coche personnelle d'un devoir. */
export async function setHomeworkDone(
  homeworkId: string,
  done: boolean,
): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: FAILED };
  return run(
    (s) =>
      done
        ? s.from("homework_done").insert({ homework_id: homeworkId })
        : s
            .from("homework_done")
            .delete()
            .eq("homework_id", homeworkId)
            .eq("user_id", viewer.userId),
    ["/accueil", "/devoirs"],
  );
}

export async function justifyEvent(
  eventId: string,
  reason: string,
  comment: string,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("justify_life_event", {
        p_event: eventId,
        p_reason: reason,
        p_comment: comment,
      }),
    ["/vie-scolaire", "/accueil"],
  );
}

export async function validateAttendance(
  lessonId: string,
  statuses: Record<string, "present" | "absent" | "late">,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("validate_attendance", {
        p_lesson: lessonId,
        p_statuses: statuses,
      }),
    ["/appel", "/accueil"],
  );
}

export async function setSkillLevels(
  assessmentId: string,
  studentId: string,
  levels: EvalValue[],
): Promise<ActionResult> {
  // Le niveau global reste « non évalué » : il n'est jamais calculé à partir des compétences (pas de moyenne).
  return run(
    (s) =>
      s.rpc("set_assessment_result", {
        p_assessment: assessmentId,
        p_student: studentId,
        p_level: "NE",
        p_skill_levels: levels,
      }),
    [],
  );
}

/** Compte à plusieurs rôles : changer d'espace (élève, parent…). Seule une fiche du compte est acceptée. */
export async function selectSpace(profileId: string): Promise<void> {
  const viewer = await getViewer();
  if (!viewer?.spaces.some((s) => s.id === profileId)) return;
  const store = await cookies();
  store.set(PROFILE_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  store.delete(CHILD_COOKIE);
  revalidatePath("/", "layout");
  redirect("/accueil");
}

/** Responsable : choisir l'enfant affiché. Seul un enfant dont on est responsable est accepté. */
export async function selectChild(studentId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer?.children.some((c) => c.id === studentId))
    return { ok: false, error: FAILED };
  (await cookies()).set(CHILD_COOKIE, studentId, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export type UploadTicket =
  | { ok: true; id: string; path: string; token: string }
  | { ok: false; error: string };

/**
 * Ajouter un document, étape 1 : create_document vérifie les droits et crée la ligne,
 * puis le serveur délivre un lien d'envoi à usage unique pour ce seul chemin.
 */
export async function prepareDocument(input: {
  title: string;
  category: "administratif" | "pedagogique" | "cantine";
  classId: string | null;
  requiresSignature: boolean;
  fileName: string;
  size: number;
  type: string;
}): Promise<UploadTicket> {
  const store = storage();
  if (!store)
    return {
      ok: false,
      error: "Le stockage des documents n'est pas configuré sur le serveur.",
    };
  if (!DOCUMENT_TYPES.includes(input.type))
    return {
      ok: false,
      error:
        "Ce type de fichier n'est pas accepté (PDF, image, Word, Excel, OpenDocument ou texte).",
    };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_document", {
    p_title: input.title,
    p_category: input.category,
    p_class: input.classId as string,
    p_requires_signature: input.requiresSignature,
    p_file_name: input.fileName,
    p_size_bytes: input.size,
    p_mime_type: input.type,
  });
  const row = data?.[0];
  if (error || !row)
    return {
      ok: false,
      error:
        error &&
        /^[A-ZÉÈ]/.test(error.message) &&
        !/permission|violates/i.test(error.message)
          ? error.message
          : FAILED,
    };
  const { data: ticket } = await store.createSignedUploadUrl(row.storage_path);
  if (!ticket) {
    await supabase.rpc("delete_document", { p_document: row.id });
    return { ok: false, error: FAILED };
  }
  return { ok: true, id: row.id, path: row.storage_path, token: ticket.token };
}

/** Ajouter un document, étape 2 : le fichier est bien arrivé, le document devient visible. */
export async function confirmDocument(
  documentId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const viewer = await getViewer();
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, created_by")
    .eq("id", documentId)
    .maybeSingle();
  if (!viewer || !doc?.storage_path || doc.created_by !== (await actingProfileId(viewer)))
    return { ok: false, error: FAILED };
  const store = storage();
  const folder = doc.storage_path.split("/").slice(0, -1).join("/");
  const { data: files } = (await store?.list(folder)) ?? { data: null };
  if (!files?.some((f) => doc.storage_path!.endsWith(`/${f.name}`)))
    return { ok: false, error: "Le fichier n'est pas arrivé. Réessayez." };
  await createAdminClient()!
    .from("documents")
    .update({ uploaded_at: new Date().toISOString() })
    .eq("id", documentId);
  revalidatePath("/documents");
  return { ok: true };
}

/** Retirer un document (auteur, direction, secrétariat) : la ligne, puis le fichier. */
export async function deleteDocument(
  documentId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: path, error } = await supabase.rpc("delete_document", {
    p_document: documentId,
  });
  if (error) return { ok: false, error: FAILED };
  if (path) await storage()?.remove([path]);
  revalidatePath("/documents");
  return { ok: true };
}

export type AgendaInput = {
  title: string;
  startsOn: string;
  endsOn: string | null;
  classId: string | null;
  tone: "ok" | "danger" | "warn" | "info" | "neutral" | "brand";
  holiday: boolean;
};

/** Agenda : ajouter un événement (administration ; professeur pour ses classes). */
export async function addAgendaEvent(e: AgendaInput): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("add_agenda_event", {
        p_title: e.title,
        p_starts_on: e.startsOn,
        p_ends_on: e.endsOn as string,
        p_class: e.classId as string,
        p_tone: e.tone,
        p_is_holiday: e.holiday,
      }),
    ["/agenda", "/accueil"],
  );
}

export async function deleteAgendaEvent(
  eventId: string,
): Promise<ActionResult> {
  return run(
    (s) => s.rpc("delete_agenda_event", { p_event: eventId }),
    ["/agenda", "/accueil"],
  );
}

/** Annuaire (secrétariat, direction) : nom et civilité d'une personne de l'établissement. */
export async function updatePersonName(
  profileId: string,
  firstName: string,
  lastName: string,
  civility: "madame" | "monsieur" | null,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("update_person_name", {
        p_profile: profileId,
        p_first_name: firstName,
        p_last_name: lastName,
        p_civility: civility as "madame",
      }),
    ["/annuaire"],
  );
}

/**
 * Annuaire : adresse e-mail. update_person_email vérifie les droits et enregistre l'adresse de contact ;
 * si la personne a un compte, le serveur change aussi son adresse de connexion.
 */
export async function updatePersonEmail(
  profileId: string,
  email: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const address = email.trim().toLowerCase();
  const { error } = await supabase.rpc("update_person_email", {
    p_profile: profileId,
    p_email: address,
  });
  if (error)
    return {
      ok: false,
      error:
        /^[A-ZÉÈ]/.test(error.message) &&
        !/permission|violates/i.test(error.message)
          ? error.message
          : FAILED,
    };
  const { data: userId } = await supabase.rpc("manageable_person", {
    p_profile: profileId,
  });
  if (userId) {
    const admin = createAdminClient();
    if (!admin)
      return {
        ok: false,
        error:
          "Adresse de contact enregistrée, mais l'adresse de connexion n'a pas pu être changée (serveur non configuré).",
      };
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      email: address,
      email_confirm: true,
    });
    if (authError)
      return {
        ok: false,
        error: /already|exists|registered/i.test(authError.message)
          ? "Cette adresse est déjà utilisée par un autre compte."
          : FAILED,
      };
  }
  revalidatePath("/annuaire");
  return { ok: true };
}

/** Bulletins : préparer ceux d'une classe pour un trimestre (direction, secrétariat). */
export async function prepareReportCards(
  classId: string,
  term: number,
  publishOn: string,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("create_report_cards", {
        p_class: classId,
        p_term: term,
        p_publish_on: publishOn,
      }),
    ["/bulletins"],
  );
}

/** Bulletins : positionnement (nul si noté sur 20) et appréciation d'une matière. Appréciation vide : ligne retirée. */
export async function saveReportLine(
  reportCardId: string,
  subjectId: string,
  level: "MI" | "MF" | "MS" | "TB" | null,
  comment: string,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("set_report_line", {
        p_report_card: reportCardId,
        p_subject: subjectId,
        p_level: level as "MI",
        p_comment: comment,
      }),
    ["/bulletins"],
  );
}

/** Bulletins : supprimer celui d'un élève, ou ceux d'une classe pour un trimestre (direction, secrétariat). */
export async function deleteReportCard(
  reportCardId: string,
): Promise<ActionResult> {
  return run(
    (s) => s.rpc("delete_report_card", { p_report_card: reportCardId }),
    ["/bulletins"],
  );
}

export async function deleteReportCards(
  classId: string,
  term: number,
): Promise<ActionResult> {
  return run(
    (s) => s.rpc("delete_report_cards", { p_class: classId, p_term: term }),
    ["/bulletins"],
  );
}

/** Bulletins : avis du conseil de classe (direction). */
export async function saveReportCouncil(
  reportCardId: string,
  mention: string,
  text: string,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("set_report_council", {
        p_report_card: reportCardId,
        p_mention: mention,
        p_text: text,
      }),
    ["/bulletins"],
  );
}

export type NewPerson = {
  kind: "eleve" | "parent" | "prof" | "cpe" | "direction" | "secretariat";
  firstName: string;
  lastName: string;
  civility: "madame" | "monsieur" | null;
  email: string;
  classId: string | null;
  children: string[];
  /** Élève : classes suivies en plus de la classe principale. */
  extraClasses: string[];
  /** Enseignant : classes (et matières, hors primaire) à lui confier. */
  teachings: { classId: string; subjectId: string | null }[];
};
export type CreatedPerson =
  | {
      ok: true;
      password: string | null;
      /** Rattachée à un compte existant (même adresse). */ linked?: boolean;
    }
  | { ok: false; error: string };

/** Mot de passe provisoire lisible : 4 groupes de 4 majuscules et chiffres, sans caractère ambigu (0/O, 1/I). */
function temporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
  return chars.match(/.{4}/g)!.join("-");
}

export type ResetResult =
  | { ok: true; password: string }
  | { ok: false; error: string };

/** Annuaire : nouveau mot de passe provisoire pour une personne de l'établissement (secrétariat, direction). */
export async function resetPassword(profileId: string): Promise<ResetResult> {
  const supabase = await createClient();
  const { data: userId, error } = await supabase.rpc("manageable_person", {
    p_profile: profileId,
  });
  if (error)
    return {
      ok: false,
      error:
        /^[A-ZÉÈ]/.test(error.message) && !/permission/i.test(error.message)
          ? error.message
          : FAILED,
    };
  if (!userId)
    return {
      ok: false,
      error: "Cette personne n'a pas de compte de connexion.",
    };
  const admin = createAdminClient();
  if (!admin)
    return {
      ok: false,
      error: "La gestion des comptes n'est pas configurée sur le serveur.",
    };
  const password = temporaryPassword();
  const { error: e } = await admin.auth.admin.updateUserById(userId, {
    password,
  });
  if (e) return { ok: false, error: FAILED };
  return { ok: true, password };
}

/**
 * Annuaire : ajouter une personne. create_person vérifie les droits et crée la fiche ;
 * avec une adresse e-mail, le serveur ouvre aussi le compte (mot de passe provisoire, affiché une fois).
 */
export async function createPerson(p: NewPerson): Promise<CreatedPerson> {
  const supabase = await createClient();
  const readable = (m: string) =>
    /^[A-ZÉÈ]/.test(m) && !/permission|violates|duplicate/i.test(m)
      ? m
      : FAILED;
  const address = p.email.trim().toLowerCase();
  if (address && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address))
    return { ok: false, error: "Adresse e-mail invalide." };
  const admin = createAdminClient();
  if (address && !admin)
    return {
      ok: false,
      error: "La création de comptes n'est pas configurée sur le serveur.",
    };

  const { data: id, error } = await supabase.rpc("create_person", {
    p_kind: p.kind,
    p_first_name: p.firstName,
    p_last_name: p.lastName,
    p_civility: p.civility as "madame",
    p_class: p.classId as string,
    p_children: p.children,
  });
  if (error || !id)
    return { ok: false, error: error ? readable(error.message) : FAILED };

  for (const c of p.kind === "eleve" ? p.extraClasses : []) {
    const { error: e } = await supabase.rpc("add_class_member", {
      p_student: id,
      p_class: c,
    });
    if (e)
      return {
        ok: false,
        error: `Élève ajouté, mais une classe supplémentaire a échoué : ${readable(e.message)}`,
      };
  }
  for (const t of p.teachings) {
    const { error: e } = await supabase.rpc("assign_teaching", {
      p_teacher: id,
      p_class: t.classId,
      p_subject: t.subjectId as string,
      p_head: false,
    });
    if (e)
      return {
        ok: false,
        error: `Personne ajoutée, mais une affectation a échoué : ${readable(e.message)}`,
      };
  }

  let password: string | null = null;
  if (address) {
    await supabase.rpc("update_person_email", {
      p_profile: id,
      p_email: address,
    });
    password = temporaryPassword();
    const { data: created, error: authError } =
      await admin!.auth.admin.createUser({
        email: address,
        password,
        email_confirm: true,
      });
    if (authError || !created.user) {
      if (!/already|exists|registered/i.test(authError?.message ?? ""))
        return {
          ok: false,
          error: "Personne ajoutée, mais le compte n'a pas pu être créé.",
        };
      // Adresse déjà utilisée : la nouvelle fiche devient un espace de plus de ce compte (élève et parent…).
      const { data: existing } = await admin!.rpc("account_id_by_email", {
        p_email: address,
      });
      const { error: linkError } = existing
        ? await supabase.rpc("link_profile_account", {
            p_profile: id,
            p_user: existing,
          })
        : { error: { message: "" } };
      if (linkError)
        return {
          ok: false,
          error:
            "Personne ajoutée, mais son compte existant n'a pas pu être rattaché.",
        };
      revalidatePath("/annuaire");
      return { ok: true, password: null, linked: true };
    }
    // La fiche vient d'être créée par cet utilisateur (create_person a vérifié ses droits) : on y rattache le compte.
    await admin!
      .from("profiles")
      .update({ user_id: created.user.id })
      .eq("id", id)
      .is("user_id", null);
  }
  revalidatePath("/annuaire");
  return { ok: true, password };
}

/** Annuaire : rattacher un responsable à un élève. */
/** Annuaire : inscrire un élève dans une classe supplémentaire (ex. « Cours Sup »), ou l'en retirer. */
export async function addClassMember(
  studentId: string,
  classId: string,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("add_class_member", { p_student: studentId, p_class: classId }),
    ["/annuaire"],
  );
}

export async function removeClassMember(
  studentId: string,
  classId: string,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("remove_class_member", { p_student: studentId, p_class: classId }),
    ["/annuaire"],
  );
}

export async function linkGuardian(
  guardianId: string,
  studentId: string,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("link_guardian", { p_guardian: guardianId, p_student: studentId }),
    ["/annuaire"],
  );
}

/** Annuaire : confier une classe (et une matière hors primaire) à un enseignant. */
export async function assignTeaching(
  teacherId: string,
  classId: string,
  subjectId: string | null,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("assign_teaching", {
        p_teacher: teacherId,
        p_class: classId,
        p_subject: subjectId as string,
        p_head: false,
      }),
    ["/annuaire"],
  );
}

export type LessonSeriesInput = {
  classId: string;
  subjectId: string;
  teacherId: string;
  room: string;
  weekday: number;
  starts: string;
  ends: string;
  from: string;
  until: string;
  /** Chaque semaine, semaine A, semaine B, tous les mois (n-ième jour), tous les jours. */
  recurrence: "weekly" | "week_a" | "week_b" | "monthly" | "daily";
  /** Tous les mois : 1 à 4, ou 5 pour le dernier. */
  nth: number | null;
  /** Demi-groupe ou option visé ; nul : classe entière. */
  groupId?: string | null;
};

/** Emploi du temps : créer une série de cours sur une période (secrétariat). */
export async function createLessonSeries(
  i: LessonSeriesInput,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_lesson_set", {
    p_group: i.groupId ?? null,
    p_class: i.classId,
    p_subject: i.subjectId,
    p_teacher: i.teacherId,
    p_room: i.room,
    p_weekday: i.weekday,
    p_starts: i.starts,
    p_ends: i.ends,
    p_from: i.from,
    p_until: i.until,
    p_recurrence: i.recurrence,
    p_nth: i.nth,
  });
  if (error)
    return {
      ok: false,
      error:
        /^[A-ZÉÈL]/.test(error.message) &&
        !/permission|violates|syntax/i.test(error.message)
          ? error.message
          : FAILED,
    };
  revalidatePath("/emploi-du-temps");
  return { ok: true, count: data ?? 0 };
}

export type LessonEdit = {
  subjectId: string;
  teacherId: string;
  room: string;
  day: string;
  starts: string;
  ends: string;
  /** Ce cours seulement, ou ce cours et les suivants de la série. */
  scope: "one" | "following";
};

/** Emploi du temps : modifier un cours (secrétariat). */
export async function updateLesson(
  lessonId: string,
  e: LessonEdit,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("update_lesson", {
        p_lesson: lessonId,
        p_subject: e.subjectId,
        p_teacher: e.teacherId,
        p_room: e.room,
        p_day: e.day,
        p_starts: e.starts,
        p_ends: e.ends,
        p_scope: e.scope,
      }),
    ["/emploi-du-temps", "/accueil"],
  );
}

/** Groupes : créer des groupes dans une famille (Demi-groupe, LV2, LV3…) d'une classe (secrétariat). */
export async function createClassGroups(
  classId: string,
  family: string,
  names: string[],
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("create_class_groups", {
        p_class: classId,
        p_family: family,
        p_names: names,
      }),
    ["/emploi-du-temps"],
  );
}

/** Groupes : placer un élève dans un groupe d'une famille (nul : aucun). */
export async function setStudentGroup(
  studentId: string,
  classId: string,
  family: string,
  groupId: string | null,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("set_student_group", {
        p_student: studentId,
        p_class: classId,
        p_family: family,
        p_group: groupId,
      }),
    ["/emploi-du-temps", "/accueil"],
  );
}

/** Emploi du temps : changer le groupe d'un cours (ou de ce cours et des suivants). */
export async function setLessonGroup(
  lessonId: string,
  groupId: string | null,
  scope: "one" | "following",
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("set_lesson_group", {
        p_lesson: lessonId,
        p_group: groupId,
        p_scope: scope,
      }),
    ["/emploi-du-temps", "/accueil"],
  );
}

/** Emploi du temps : supprimer un cours (secrétariat ; refusé si l'appel est fait). */
export async function deleteLesson(lessonId: string): Promise<ActionResult> {
  return run(
    (s) => s.rpc("delete_lesson", { p_lesson: lessonId }),
    ["/emploi-du-temps", "/accueil"],
  );
}

/** Annuler ou rétablir un cours (son enseignant, l'administration). */
export async function setLessonCancelled(
  lessonId: string,
  cancelled: boolean,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("set_lesson_cancelled", {
        p_lesson: lessonId,
        p_cancelled: cancelled,
      }),
    ["/emploi-du-temps", "/accueil"],
  );
}

/** Retirer les cours à venir d'une série, à partir d'une date (ceux qui ont déjà un appel restent). */
export async function deleteLessonSeries(
  seriesId: string,
  from: string,
): Promise<ActionResult> {
  return run(
    (s) => s.rpc("delete_lesson_series", { p_series: seriesId, p_from: from }),
    ["/emploi-du-temps", "/accueil"],
  );
}

export async function setScore(
  assessmentId: string,
  studentId: string,
  score: number | null,
  status: "NE" | "ABS" | "DISP",
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("set_assessment_score", {
        p_assessment: assessmentId,
        p_student: studentId,
        p_score: score as number,
        p_status: status,
      }),
    [],
  );
}

export async function publishAssessment(
  assessmentId: string,
): Promise<ActionResult> {
  return run(
    (s) => s.rpc("publish_assessment", { p_assessment: assessmentId }),
    ["/appel", "/accueil", "/evaluations"],
  );
}

export async function sendMessage(
  recipients: string[],
  subject: string,
  body: string,
  replyTo?: string,
): Promise<ActionResult> {
  if (!body.trim())
    return { ok: false, error: "Écrivez votre message avant de l'envoyer." };
  if (!subject.trim()) return { ok: false, error: "Indiquez un objet." };
  if (!recipients.length) return { ok: false, error: "Choisissez au moins un destinataire." };
  let id: string | null = null;
  const r = await run(
    async (s) => {
      const res = await s.rpc("send_message", {
        p_recipients: [...new Set(recipients)],
        p_subject: subject,
        p_body: body,
        p_reply_to: replyTo,
      });
      id = res.data;
      return res;
    },
    ["/messagerie"],
  );
  // E-mail « Vous avez un message sur Préau », après la réponse (n'attend pas Brevo).
  const sent = id;
  if (r.ok && sent) after(() => notifyNewMessage(sent));
  return r;
}

/** Messagerie : programmer un message (date d'envoi à venir, ISO). La notification part à cette date. */
export async function scheduleMessage(
  recipients: string[],
  subject: string,
  body: string,
  sendAt: string,
): Promise<ActionResult> {
  if (!body.trim())
    return { ok: false, error: "Écrivez votre message avant de l'envoyer." };
  if (!subject.trim()) return { ok: false, error: "Indiquez un objet." };
  if (!recipients.length) return { ok: false, error: "Choisissez au moins un destinataire." };
  if (Number.isNaN(Date.parse(sendAt)))
    return { ok: false, error: "Choisissez une date et une heure d'envoi." };
  return run(
    (s) =>
      s.rpc("schedule_message", {
        p_recipients: [...new Set(recipients)],
        p_subject: subject,
        p_body: body,
        p_send_at: sendAt,
      }),
    ["/messagerie"],
  );
}

/** Messagerie : annuler un message programmé avant son envoi (son expéditeur). */
export async function cancelScheduledMessage(messageId: string): Promise<ActionResult> {
  return run((s) => s.rpc("cancel_scheduled_message", { p_message: messageId }), ["/messagerie"]);
}

export async function markRead(messageId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: FAILED };
  const me = await actingProfileId(viewer);
  return run(
    (s) =>
      s
        .from("message_recipients")
        .update({ read_at: new Date().toISOString() })
        .eq("message_id", messageId)
        .eq("recipient_id", me)
        .is("read_at", null),
    ["/messagerie", "/accueil"],
  );
}

export async function archiveMessage(messageId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: FAILED };
  const me = await actingProfileId(viewer);
  return run(
    (s) =>
      s
        .from("message_recipients")
        .update({ archived_at: new Date().toISOString() })
        .eq("message_id", messageId)
        .eq("recipient_id", me),
    ["/messagerie"],
  );
}

/** Résultat d'un paiement lancé : message à afficher (demande envoyée à Crédit Domestique). */
export type PaymentResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function startPayment(
  args: {
    p_kind: "facture" | "recharge_cantine";
    p_student: string;
    p_invoice?: string;
    p_amount_cents?: number;
  },
  label: string,
): Promise<PaymentResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: FAILED };
  const supabase = await createClient();
  const { data: account } = await supabase
    .from("profile_private")
    .select("credit_domestique_account")
    .eq("profile_id", viewer.profileId)
    .maybeSingle();
  const { data: id, error } = await supabase.rpc("start_payment", args);
  if (error || !id) {
    const readable =
      error &&
      /^[A-ZÉÈ][^:]*\.?$/.test(error.message) &&
      !/permission|violates/i.test(error.message);
    return { ok: false, error: readable ? error!.message : FAILED };
  }
  const { data: payment } = await supabase
    .from("payments")
    .select("amount_cents")
    .eq("id", id)
    .single();
  const result = await createCheckout(supabase, {
    paymentId: id,
    amountCents: payment?.amount_cents ?? 0,
    label,
    payerAccount: account?.credit_domestique_account ?? null,
  });
  revalidatePath("/paiements");
  return result;
}

/** Recharger le compte cantine : crée un paiement en attente chez Crédit Domestique. */
export async function topUpCanteen(
  studentId: string,
  euros: number,
): Promise<PaymentResult> {
  return startPayment(
    {
      p_kind: "recharge_cantine",
      p_student: studentId,
      p_amount_cents: Math.round(euros * 100),
    },
    "Rechargement cantine",
  );
}

/** Payer une facture : crée un paiement en attente chez Crédit Domestique. */
export async function payInvoice(
  studentId: string,
  invoiceId: string,
  label: string,
): Promise<PaymentResult> {
  return startPayment(
    { p_kind: "facture", p_student: studentId, p_invoice: invoiceId },
    label,
  );
}

export async function cancelPayment(paymentId: string): Promise<ActionResult> {
  return run(
    (s) => s.rpc("cancel_payment", { p_payment: paymentId }),
    ["/paiements"],
  );
}

export async function signDocument(documentId: string): Promise<ActionResult> {
  return run(
    (s) => s.rpc("sign_document", { p_document: documentId }),
    ["/documents"],
  );
}

export async function updatePhone(phone: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: FAILED };
  const clean = phone.trim();
  if (clean && !/^[+\d][\d\s.]{7,19}$/.test(clean))
    return {
      ok: false,
      error:
        "Indiquez un numéro de téléphone valide, par exemple 06 12 34 56 78.",
    };
  return run(
    (s) =>
      s
        .from("profile_private")
        .update({ phone: clean || null })
        .eq("profile_id", viewer.profileId),
    ["/compte"],
  );
}

export async function updateNotifications(
  settings: Record<string, boolean>,
): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: FAILED };
  return run(
    (s) =>
      s
        .from("profile_private")
        .update({ notification_settings: settings })
        .eq("profile_id", viewer.profileId),
    ["/compte"],
  );
}

/** Cahier de liaison : écrire un mot à la classe (enseignant). */
export async function postLiaisonNote(
  classId: string,
  title: string,
  body: string,
  requiresSignature: boolean,
): Promise<ActionResult> {
  return run(
    (s) =>
      s.rpc("post_liaison_note", {
        p_class: classId,
        p_title: title,
        p_body: body,
        p_requires_signature: requiresSignature,
      }),
    ["/cahier-de-liaison", "/accueil"],
  );
}

/** Cahier de liaison : « Lu et signé » (responsable). */
export async function signLiaisonNote(
  noteId: string,
  studentId: string,
): Promise<ActionResult> {
  return run(
    (s) => s.rpc("sign_liaison_note", { p_note: noteId, p_student: studentId }),
    ["/cahier-de-liaison", "/accueil"],
  );
}

/** Numéro de compte Crédit Domestique du responsable. */
export async function updateCreditDomestiqueAccount(
  account: string,
): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: FAILED };
  const clean = account.trim();
  if (clean.length > 64)
    return { ok: false, error: "Ce numéro de compte est trop long." };
  return run(
    (s) =>
      s
        .from("profile_private")
        .update({ credit_domestique_account: clean || null })
        .eq("profile_id", viewer.profileId),
    ["/compte", "/paiements"],
  );
}
