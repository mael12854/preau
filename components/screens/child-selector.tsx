"use client";

import { DropdownMenu } from "radix-ui";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { selectChild } from "@/app/(app)/actions";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

type Child = { id: string; name: string; className: string };

const initialsOf = (name: string) => name.split(" ").map((x) => x[0]).join("").slice(0, 2);

/** Sélecteur d'enfant pour les responsables légaux : toutes les pages suivent l'enfant choisi. */
export function ChildSelector({ students, currentId }: { students: Child[]; currentId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const current = students.find((c) => c.id === currentId) ?? students[0];
  if (!current) return null;
  const label = (c: Child) => `${c.name} · ${c.className}`;

  // Un seul enfant : rien à choisir, on affiche simplement son nom.
  if (students.length < 2)
    return (
      <p className="m-0 flex h-11 items-center gap-2.5 rounded-control border border-line bg-surface px-3.5 text-label">
        <Avatar initials={initialsOf(current.name)} size={26} />
        <b>{label(current)}</b>
      </p>
    );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        disabled={pending}
        className="flex h-11 items-center gap-2.5 rounded-control border border-line-strong bg-surface px-3.5 text-label disabled:opacity-60"
      >
        <span className="sr-only">Enfant affiché :</span>
        <Avatar initials={initialsOf(current.name)} size={26} />
        <b>{label(current)}</b>
        <Icon name="expand_more" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="z-50 min-w-60 rounded-control border border-line bg-surface p-1 shadow-pop">
          <DropdownMenu.RadioGroup
            value={current.id}
            onValueChange={(id) =>
              start(async () => {
                const r = await selectChild(id);
                if (r.ok) router.refresh();
                else toast({ title: r.error });
              })
            }
          >
            {students.map((c) => (
              <DropdownMenu.RadioItem
                key={c.id}
                value={c.id}
                className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[8px] px-3 text-label outline-none data-[highlighted]:bg-brand-tint data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 data-[highlighted]:outline-accent data-[highlighted]:outline-solid"
              >
                <Avatar initials={initialsOf(c.name)} size={26} />
                <span className="flex-1">{label(c)}</span>
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
