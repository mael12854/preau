"use client";

import { Icon } from "@/components/ui/icon";

type TawkApi = { showWidget?: () => void; maximize?: () => void };

/** « J'ai un problème avec le site » : ouvre le chat d'aide tawk.to (sur mobile, la bulle est masquée). */
export function HelpChatButton() {
  return (
    <button
      type="button"
      onClick={() => {
        const tawk = (window as unknown as { Tawk_API?: TawkApi }).Tawk_API;
        if (!tawk?.maximize) {
          window.alert("Le chat d'aide se charge encore. Réessayez dans quelques secondes.");
          return;
        }
        tawk.showWidget?.();
        tawk.maximize();
      }}
      className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center gap-2 rounded-[9px] px-2 text-left text-caption text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink"
    >
      <Icon name="info" size={18} />
      J&apos;ai un problème avec le site
    </button>
  );
}
