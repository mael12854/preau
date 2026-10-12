"use client";

import { DropdownMenu } from "radix-ui";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";

/** Sélecteur d'enfant pour les responsables légaux. */
export function ChildSelector({ student }: { student: { id: string; name: string; className: string } }) {
  const initials = student.name.split(" ").map((x) => x[0]).join("");
  const CHILDREN = [{ id: student.id, initials, label: `${student.name} · ${student.className}` }];
  const current = CHILDREN[0];
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex h-11 items-center gap-2.5 rounded-control border border-line-strong bg-surface px-3.5 text-label">
        <span className="sr-only">Enfant affiché :</span>
        <Avatar initials={current.initials} size={26} />
        <b>{current.label}</b>
        <Icon name="expand_more" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="z-50 min-w-60 rounded-control border border-line bg-surface p-1 shadow-pop">
          <DropdownMenu.RadioGroup value={current.id}>
            {CHILDREN.map((c) => (
              <DropdownMenu.RadioItem
                key={c.id}
                value={c.id}
                className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[8px] px-3 text-label outline-none data-[highlighted]:bg-brand-tint data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 data-[highlighted]:outline-accent data-[highlighted]:outline-solid"
              >
                <Avatar initials={c.initials} size={26} />
                <span className="flex-1">{c.label}</span>
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
