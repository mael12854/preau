"use client";

import { useRouter } from "next/navigation";
import { SelectField } from "@/components/ui/field";

/** Liste déroulante qui change de page (choix d'une classe, d'une période…). */
export function SelectLink({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; href: string }[];
}) {
  const router = useRouter();
  return (
    <SelectField
      label={label}
      options={options.map(({ value, label }) => ({ value, label }))}
      value={value}
      onValueChange={(v) => {
        const o = options.find((x) => x.value === v);
        if (o) router.push(o.href);
      }}
      className="min-w-44"
    />
  );
}
