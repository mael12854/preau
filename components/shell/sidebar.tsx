import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { signOut } from "@/app/actions";
import type { ModuleKey } from "@/lib/navigation";
import type { Viewer } from "@/lib/session";
import { Nav } from "./nav";
import { SpaceSwitcher } from "./space-switcher";

/** Contenu de la barre latérale (fixe sur ordinateur, tiroir sur mobile). */
export function SidebarContent({
  profile,
  active,
}: {
  profile: Viewer;
  active: ModuleKey;
}) {
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-3.5 py-5 text-sidebar-ink">
      <Link href="/accueil" className="flex px-2 text-sidebar-ink no-underline">
        <Logo size={30} wordmarkSize={20} inverse />
      </Link>
      <p className="m-0 border-y border-sidebar-line px-2 py-2.5 text-caption text-sidebar-muted">
        {profile.school.name}
        <br />
        <span className="text-sidebar-ink">{profile.school.year}</span>
      </p>
      {profile.spaces.length > 1 && <SpaceSwitcher spaces={profile.spaces} />}
      <Nav profile={profile} active={active} />
      <div className="flex flex-col gap-1 border-t border-sidebar-line px-2 pt-2.5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-avatar text-caption font-bold text-on-avatar"
          >
            {profile.initials}
          </span>
          <div className="flex min-w-0 flex-col text-caption">
            <b className="text-label">{profile.name}</b>
            <span className="truncate text-sidebar-muted">{profile.role}</span>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center gap-2 rounded-[9px] px-2 text-left text-caption text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink"
          >
            <Icon name="logout" size={18} />
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
