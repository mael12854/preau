"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ABSENCE_REASONS } from "@/lib/mock";

/** « Justifier » : choix du motif (obligatoire) et commentaire. */
export function JustifyButton({ onJustified, what }: { onJustified: () => void; what: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>();
  const [tried, setTried] = useState(false);
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
          setOpen(false);
          onJustified();
          toast({ title: "Justificatif envoyé à la vie scolaire" });
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
        <TextAreaField label="Commentaire (facultatif)" hint="Visible par la vie scolaire" />
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" icon="send">
            Envoyer
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
