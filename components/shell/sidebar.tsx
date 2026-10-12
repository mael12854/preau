import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import type { ModuleKey, Profile } from "@/lib/mock/profiles";
import { SCHOOL } from "@/lib/mock/school";
import { Nav } from "./nav";

/** Contenu de la barre latérale (fixe sur ordinateur, tiroir sur mobile). */
export function SidebarContent({ profile, active }: { profile: Profile; active: ModuleKey }) {
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-3.5 py-5 text-sidebar-ink">
      <Link href="/accueil" className="flex px-2 text-sidebar-ink no-underline">
        <Logo size={30} wordmarkSize={20} inverse />
      </Link>
      <p className="m-0 border-y border-sidebar-line px-2 py-2.5 text-caption text-sidebar-muted">
        {SCHOOL.name}
        <br />
        <span className="text-sidebar-ink">{SCHOOL.year}</span>
      </p>
      <Nav profile={profile} active={active} />
      <div className="flex flex-col gap-1 border-t border-sidebar-line px-2 pt-2.5">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-avatar text-caption font-bold text-on-avatar">
            {profile.initials}
          </span>
          <div className="flex min-w-0 flex-col text-caption">
            <b className="text-label">{profile.name}</b>
            <span className="truncate text-sidebar-muted">{profile.role}</span>
          </div>
        </div>
        <Link href="/" className="-mx-2 flex min-h-11 items-center gap-2 rounded-[9px] px-2 text-caption text-sidebar-muted no-underline hover:bg-sidebar-hover hover:text-sidebar-ink">
          <Icon name="swap_horiz" size={18} />
          Changer de profil (démo)
        </Link>
      </div>
    </div>
  );
}
