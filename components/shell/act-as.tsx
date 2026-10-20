"use client";

import type { ReactNode } from "react";

/** Espace « Général » : la fiche au nom de laquelle agir (cookie lu par le serveur, vérifié par la base). */
export function setActAs(profileId: string) {
  document.cookie = `preau-agir=${profileId}; path=/; samesite=lax; secure`;
}

/**
 * Section d'une école dans l'espace « Général » : toute action lancée depuis cette section
 * (clic, clavier, fenêtres ouvertes depuis elle) se fait au nom de sa fiche.
 */
export function ActAs({ profileId, children }: { profileId: string; children: ReactNode }) {
  return (
    <div
      onPointerDownCapture={() => setActAs(profileId)}
      onKeyDownCapture={() => setActAs(profileId)}
      onFocusCapture={() => setActAs(profileId)}
    >
      {children}
    </div>
  );
}
