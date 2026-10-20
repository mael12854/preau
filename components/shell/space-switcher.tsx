"use client";

import { DropdownMenu } from "radix-ui";
import { useTransition } from "react";
import { selectSpace } from "@/app/(app)/actions";
import { Icon } from "@/components/ui/icon";

/** Compte à plusieurs rôles : passer d'un espace à l'autre (élève, parent…). */
export function SpaceSwitcher({
  spaces,
}: {
  spaces: { id: string; label: string; active: boolean }[];
}) {
  const [pending, start] = useTransition();
  const current = spaces.find((s) => s.active) ?? spaces[0];
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        disabled={pending}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-[9px] border border-sidebar-line px-2.5 py-2 text-left text-caption text-sidebar-ink hover:bg-sidebar-hover disabled:opacity-60"
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-sidebar-muted">Espace</span>
          <b className="truncate text-label">{current.label}</b>
        </span>
        <Icon name="swap_horiz" size={20} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-64 rounded-control border border-line bg-surface p-1 shadow-pop"
        >
          <DropdownMenu.Label className="px-3 py-2 text-caption text-ink-muted">
            Changer d&apos;espace
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={current.id}
            onValueChange={(id) =>
              id !== current.id && start(() => selectSpace(id))
            }
          >
            {spaces.map((s) => (
              <DropdownMenu.RadioItem
                key={s.id}
                value={s.id}
                className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[8px] px-3 text-label outline-none data-[highlighted]:bg-brand-tint data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 data-[highlighted]:outline-accent data-[highlighted]:outline-solid"
              >
                <span className="flex-1">{s.label}</span>
                <DropdownMenu.ItemIndicator>
                  <Icon name="check" size={18} className="text-brand" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
