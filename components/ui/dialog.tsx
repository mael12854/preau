"use client";

import { Dialog as RDialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Fenêtre modale : rayon 14, ombre menus/modales, focus piégé, Échap pour fermer. */
export function Dialog({ open, onOpenChange, trigger, title, description, children, className }: DialogProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RDialog.Trigger asChild>{trigger}</RDialog.Trigger>}
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-[rgb(17_24_22/0.45)]" />
        <RDialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-auto rounded-card border border-line bg-surface p-6 shadow-pop",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <RDialog.Title className="m-0 font-display text-h2 font-bold">{title}</RDialog.Title>
            <RDialog.Close
              aria-label="Fermer"
              className="-mt-2 -mr-2 flex size-11 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
            >
              <Icon name="close" />
            </RDialog.Close>
          </div>
          {description && <RDialog.Description className="m-0 text-label text-ink-2">{description}</RDialog.Description>}
          {children}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

export const DialogClose = RDialog.Close;
