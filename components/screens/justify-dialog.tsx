"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { justifyEvent, reviewJustification } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextAreaField } from "@/components/ui/field";
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
