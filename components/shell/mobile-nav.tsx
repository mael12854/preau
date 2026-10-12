"use client";

import { Dialog } from "radix-ui";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

/** Bouton « Menu » et tiroir de navigation, sous 1024 px. */
export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem)");
    const close = () => mq.matches && setOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Ouvrir le menu"
        className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-control text-ink hover:bg-neutral-bg lg:hidden"
      >
        <Icon name="menu" size={24} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgb(17_24_22/0.45)] lg:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="animate-drawer-in fixed inset-y-0 left-0 z-50 w-[min(17.5rem,85vw)] bg-sidebar shadow-pop lg:hidden"
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <Dialog.Close
            aria-label="Fermer le menu"
            className="absolute top-3.5 right-2 flex size-11 items-center justify-center rounded-control text-sidebar-ink hover:bg-sidebar-hover"
          >
            <Icon name="close" />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
