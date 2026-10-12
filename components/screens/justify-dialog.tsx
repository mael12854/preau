"use client";

import { useState, useTransition } from "react";
import { justifyEvent } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ABSENCE_REASONS } from "@/lib/reference";

/** « Justifier » : choix du motif (obligatoire) et commentaire. */
export function JustifyButton({ eventId, what }: { eventId: string; what: string }) {
  const toast = useToast();
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
      title="Justifier l'absence"
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
            toast({ title: "Justificatif envoyé à la vie scolaire" });
          });
        }}
      >
        <SelectField
          label="Motif d'absence"
          placeholder="Choisir un motif"
          options={ABSENCE_REASONS}
          value={reason}
          onValueChange={setReason}
          error={tried && !reason ? "Indiquez un motif pour justifier." : undefined}
        />
        <TextAreaField label="Commentaire (facultatif)" hint="Visible par la vie scolaire" value={comment} onChange={(e) => setComment(e.target.value)} />
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
