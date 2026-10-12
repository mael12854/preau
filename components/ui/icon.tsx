import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/cn";

type IconProps = {
  name: IconName;
  /** Taille en px (convertie en rem). 20 par défaut. */
  size?: number;
  filled?: boolean;
  className?: string;
  /** Si fourni, l'icône est annoncée ; sinon elle est décorative. */
  label?: string;
};

export function Icon({ name, size = 20, filled, className, label }: IconProps) {
  return (
    <span
      className={cn("icon", className)}
      data-filled={filled ? "true" : undefined}
      style={{ fontSize: `${size / 16}rem`, width: `${size / 16}rem`, height: `${size / 16}rem` }}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {name}
    </span>
  );
}
