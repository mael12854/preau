import type { ReactNode } from "react";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

type AlertTone = "info" | "danger" | "warn" | "ok";

const STYLES: Record<AlertTone, { bg: string; icon: string; name: IconName }> = {
  info: { bg: "bg-info-bg", icon: "text-info", name: "info" },
  danger: { bg: "bg-danger-bg", icon: "text-danger", name: "error" },
  warn: { bg: "bg-warn-bg", icon: "text-warn", name: "warning" },
  ok: { bg: "bg-ok-bg", icon: "text-ok", name: "check_circle" },
};

type AlertProps = {
  tone?: AlertTone;
  title: ReactNode;
  children?: ReactNode;
  /** Bouton d'action à droite (ex. « Justifier »). */
  action?: ReactNode;
  icon?: IconName;
  className?: string;
};

/** Alerte : rayon 12, icône colorée, titre en gras puis texte. */
export function Alert({ tone = "info", title, children, action, icon, className }: AlertProps) {
  const s = STYLES[tone];
  return (
    <div
      role={tone === "danger" || tone === "warn" ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-alert px-4 py-3.5 text-label text-ink sm:flex-nowrap",
        s.bg,
        className,
      )}
    >
      <Icon name={icon ?? s.name} size={22} className={cn(s.icon, "self-start sm:self-center")} />
      <div className="min-w-0 flex-1 basis-48 leading-[1.45]">
        <b>{title}</b>
        {children ? <> {children}</> : null}
      </div>
      {action}
    </div>
  );
}
