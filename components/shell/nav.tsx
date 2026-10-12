import Link from "next/link";
import { Counter } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { MODULES, moduleLabel, navCountLabel, type ModuleKey } from "@/lib/navigation";
import type { Viewer } from "@/lib/session";

/** Navigation principale, filtrée selon le profil. */
export function Nav({ profile, active }: { profile: Viewer; active: ModuleKey }) {
  return (
    <nav aria-label="Navigation principale" className="flex-1">
      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
        {profile.nav.map((key) => {
          const m = MODULES[key];
          const isActive = key === active;
          const count = profile.counts[key] ?? 0;
          return (
            <li key={key}>
              <Link
                href={`/${m.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-[9px] px-2.5 py-2 text-ui no-underline",
                  isActive
                    ? "bg-sidebar-active font-bold text-on-sidebar-active"
                    : "text-sidebar-nav hover:bg-sidebar-hover hover:text-sidebar-ink",
                )}
              >
                <Icon name={m.icon} size={21} filled={isActive} />
                <span className="flex-1">{moduleLabel(profile, key)}</span>
                {count > 0 && !isActive && <Counter count={count} label={navCountLabel(key, count)} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
