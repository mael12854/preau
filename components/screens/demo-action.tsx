"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** Bouton de démonstration : confirme l'action par un toast. */
export function DemoActionButton({ label, message, ...props }: { label: string; message: string } & Omit<ButtonProps, "onClick" | "children">) {
  const toast = useToast();
  return (
    <Button size="sm" {...props} onClick={() => toast({ title: message })}>
      {label}
    </Button>
  );
}
