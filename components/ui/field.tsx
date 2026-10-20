"use client";

import { Select as RSelect } from "radix-ui";
import { useId, type ComponentProps, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

const CONTROL =
  "h-11 w-full rounded-control border-[1.5px] bg-surface px-3 text-md text-ink transition-[border-color] " +
  "placeholder:text-ink-muted focus:border-brand";

type FieldShellProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Libellé lu par les lecteurs d'écran seulement (tableaux de saisie). */
  hideLabel?: boolean;
};

function FieldShell({ id, label, hint, error, children, className, hideLabel }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-label font-bold"}>
        {label}
      </label>
      {children}
      {error ? (
        <span id={`${id}-error`} className="flex items-center gap-1 text-caption text-danger">
          <Icon name="error" size={16} />
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="text-caption text-ink-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
  fieldClassName?: string;
};

/** Champ texte : hauteur 44, rayon 10, bordure 1,5 px. Libellé toujours visible au-dessus. */
export function TextField({ label, hint, error, id, fieldClassName, className, readOnly, ...props }: TextFieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} className={fieldClassName}>
      <input
        id={fid}
        readOnly={readOnly}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className={cn(
          CONTROL,
          error ? "border-danger" : readOnly ? "border-line bg-surface-2 text-ink-2" : "border-line-strong",
          className,
        )}
        {...props}
      />
    </FieldShell>
  );
}

type SelectFieldProps = {
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
  className?: string;
  hideLabel?: boolean;
  disabled?: boolean;
};

/** Liste déroulante accessible (Radix Select), même gabarit que le champ texte. */
export function SelectField({ label, placeholder, options, hint, error, id, className, hideLabel, ...rest }: SelectFieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} className={className} hideLabel={hideLabel}>
      <RSelect.Root {...rest}>
        <RSelect.Trigger
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          className={cn(
            CONTROL,
            "flex items-center justify-between gap-2 text-left data-[placeholder]:text-ink-muted",
            error ? "border-danger" : "border-line-strong",
          )}
        >
          <RSelect.Value placeholder={placeholder} />
          <RSelect.Icon className="text-ink-2">
            <Icon name="expand_more" />
          </RSelect.Icon>
        </RSelect.Trigger>
        <RSelect.Portal>
          <RSelect.Content
            position="popper"
            sideOffset={6}
            className="z-50 max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-control border border-line bg-surface shadow-pop"
          >
            <RSelect.Viewport className="p-1">
              {options.map((o) => (
                <RSelect.Item
                  key={o.value}
                  value={o.value}
                  className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[8px] px-3 text-md outline-none select-none data-[highlighted]:bg-brand-tint data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 data-[highlighted]:outline-accent data-[highlighted]:outline-solid data-[state=checked]:font-bold"
                >
                  <RSelect.ItemText>{o.label}</RSelect.ItemText>
                  <RSelect.ItemIndicator>
                    <Icon name="check" size={18} className="text-brand" />
                  </RSelect.ItemIndicator>
                </RSelect.Item>
              ))}
            </RSelect.Viewport>
          </RSelect.Content>
        </RSelect.Portal>
      </RSelect.Root>
    </FieldShell>
  );
}

/** Zone de texte multiligne (réponse à un message, motif…). */
export function TextAreaField({
  label,
  hint,
  id,
  className,
  hideLabel,
  ...props
}: Omit<ComponentPropsWithoutRef<"textarea">, "id"> & { label: string; hint?: ReactNode; id?: string; hideLabel?: boolean }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fid} className={hideLabel ? "sr-only" : "text-label font-bold"}>
        {label}
      </label>
      <textarea
        id={fid}
        aria-describedby={hint ? `${fid}-hint` : undefined}
        className={cn(CONTROL, "h-auto min-h-24 resize-y border-line-strong py-2.5 leading-normal", className)}
        {...props}
      />
      {hint && (
        <span id={`${fid}-hint`} className="text-caption text-ink-muted">
          {hint}
        </span>
      )}
    </div>
  );
}
