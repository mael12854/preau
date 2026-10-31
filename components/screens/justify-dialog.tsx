"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addAbsence, justifyEvent, requestJustification, requestStudentJustifications, reviewJustification } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/choice";
import { useToast } from "@/components/ui/toast";
import { ABSENCE_REASONS } from "@/lib/reference";

/** « Justifier » : choix du motif (obligatoire) et commentaire. */
export function JustifyButton({
  eventId,
  what,
  staff = false,
  late = false,
}: {
  eventId: string;
  what: string;
  /** Vie scolaire, direction, secrétariat : la justification est validée tout de suite. */
  staff?: boolean;
  late?: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>();
  const [comment, setComment] = useState("");
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTried(false);
      }}
      title={late ? "Justifier le retard" : "Justifier l'absence"}
      description={what}
      trigger={<Button size="sm">Justifier</Button>}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTried(true);
          if (!reason) return;
          const label = ABSENCE_REASONS.find((r) => r.value === reason)?.label ?? reason;
          start(async () => {
            const r = await justifyEvent(eventId, label, comment);
            if (!r.ok) return setError(r.error);
            setOpen(false);
            toast({ title: staff ? (late ? "Retard justifié" : "Absence justifiée") : "Justificatif envoyé à l'établissement" });
            router.refresh();
          });
        }}
      >
        <SelectField
          label={late ? "Motif du retard" : "Motif d'absence"}
          placeholder="Choisir un motif"
          options={ABSENCE_REASONS}
          value={reason}
          onValueChange={setReason}
          error={tried && !reason ? "Indiquez un motif pour justifier." : undefined}
        />
        <TextAreaField label="Commentaire (facultatif)" hint={staff ? "Visible par la famille" : "Visible par l'établissement"} value={comment} onChange={(e) => setComment(e.target.value)} />
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" icon="send" disabled={pending}>
            {pending ? "Envoi…" : "Envoyer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Justificatif envoyé par la famille : l'accepter, ou le refuser en expliquant pourquoi. */
export function ReviewButtons({ eventId, what, reason, comment }: { eventId: string; what: string; reason?: string; comment?: string }) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [why, setWhy] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const act = (accept: boolean) =>
    start(async () => {
      const r = await reviewJustification(eventId, accept, why);
      if (!r.ok) return setError(r.error);
      setOpen(false);
      toast({ title: accept ? "Justificatif accepté" : "Justificatif refusé : la famille peut en renvoyer un" });
      router.refresh();
    });
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setError(undefined);
      }}
      title="Justificatif de la famille"
      description={what}
      trigger={<Button size="sm">Examiner</Button>}
    >
      <div className="flex flex-col gap-4">
        <p className="m-0 rounded-control bg-surface-2 px-4 py-3 text-ui">
          <b>Motif :</b> {reason ?? "—"}
          {comment && (
            <>
              <br />
              <span className="text-ink-2">{comment}</span>
            </>
          )}
        </p>
        <TextAreaField
          label="Réponse à la famille (obligatoire pour refuser)"
          value={why}
          onChange={(e) => setWhy(e.target.value)}
        />
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button variant="secondary" disabled={pending} onClick={() => act(false)}>
            Refuser
          </Button>
          <Button icon="check" disabled={pending} onClick={() => act(true)}>
            Accepter
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** Établissement : demander un justificatif (une absence, ou toutes celles non justifiées d'un élève). */
export function RequestButton({
  eventId,
  studentId,
  what,
  label = "Demander un justificatif",
  variant = "secondary",
}: {
  eventId?: string;
  studentId?: string;
  what: string;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setError(undefined);
      }}
      title={label}
      description={what}
      trigger={
        <Button size="sm" variant={variant}>
          {label}
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = eventId ? await requestJustification(eventId, note) : await requestStudentJustifications(studentId!, note);
            if (!r.ok) return setError(r.error);
            setOpen(false);
            setNote("");
            toast({ title: "Demande envoyée à la famille" });
            router.refresh();
          });
        }}
      >
        <p className="m-0 text-label text-ink-2">
          {eventId
            ? "L'absence repasse « à justifier » (même si elle était justifiée) et la famille reçoit un message, ou l'élève lui-même s'il n'a pas de responsable."
            : "Un seul message liste toutes ses absences et retards à justifier."}
        </p>
        <TextAreaField label="Précision (facultatif)" hint="Par exemple : certificat médical attendu." value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" icon="send" disabled={pending}>
            {pending ? "Envoi…" : "Envoyer la demande"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Établissement : saisir une absence ou un retard passé (jour sans appel, absences d'avant), et demander le justificatif. */
export function AddAbsenceButton({ students, today }: { students: { id: string; label: string }[]; today: string }) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState<string>();
  const [kind, setKind] = useState<"absence" | "retard">("absence");
  const [day, setDay] = useState(today);
  const [wholeDay, setWholeDay] = useState(true);
  const [from, setFrom] = useState("08:00");
  const [to, setTo] = useState("09:00");
  const [detail, setDetail] = useState("");
  const [request, setRequest] = useState(true);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  if (!students.length) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setError(undefined);
      }}
      title="Ajouter une absence"
      description="Pour un jour sans appel, ou une absence d'avant Préau."
      trigger={
        <Button icon="add" className="h-12 px-4 text-label">
          Ajouter une absence
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!studentId) return setError("Choisissez un élève.");
          start(async () => {
            const r = await addAbsence({ studentId, kind, day, wholeDay, from, to, detail, request });
            if (!r.ok) return setError(r.error);
            setOpen(false);
            setDetail("");
            toast({ title: request ? "Absence ajoutée, justificatif demandé à la famille" : "Absence ajoutée" });
            router.refresh();
          });
        }}
      >
        <SelectField label="Élève" placeholder="Choisir un élève" options={students.map((s) => ({ value: s.id, label: s.label }))} value={studentId} onValueChange={setStudentId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Type"
            options={[
              { value: "absence", label: "Absence" },
              { value: "retard", label: "Retard" },
            ]}
            value={kind}
            onValueChange={(v) => setKind(v as "absence" | "retard")}
          />
          <TextField label="Date" type="date" max={today} value={day} onChange={(e) => setDay(e.target.value)} required />
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-label">
          <Checkbox checked={wholeDay} onCheckedChange={setWholeDay} />
          Journée entière
        </label>
        {!wholeDay && (
          <div className="grid grid-cols-2 gap-4">
            <TextField label="De" type="time" value={from} onChange={(e) => setFrom(e.target.value)} required />
            <TextField label="À" type="time" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
        <TextField label="Cours ou précision (facultatif)" placeholder="Mathématiques" value={detail} maxLength={120} onChange={(e) => setDetail(e.target.value)} />
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-label">
          <Checkbox checked={request} onCheckedChange={setRequest} />
          Demander le justificatif à la famille (message et e-mail)
        </label>
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
