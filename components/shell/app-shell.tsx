import type { ReactNode } from "react";
import { MODULES, moduleLabel, type ModuleKey } from "@/lib/navigation";
import type { Viewer } from "@/lib/session";
import { ChildSelector } from "@/components/screens/child-selector";
import { MobileNav } from "./mobile-nav";
import { SidebarContent } from "./sidebar";
import { SkipLink } from "./skip-link";
import { TopbarTools } from "./topbar-tools";

type AppShellProps = {
  profile: Viewer;
  module: ModuleKey;
  children: ReactNode;
};

/** Coque : barre latérale 240 px, barre du haut 72 px, contenu 28 / 32. */
export function AppShell({ profile, module, children }: AppShellProps) {
  const title = moduleLabel(profile, module);
  const entries = profile.nav.map((k) => ({
    label: moduleLabel(profile, k),
    href: `/${MODULES[k].slug}`,
  }));
  return (
    <>
      <SkipLink />
      <div data-aide-menu="" className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside aria-label="Menu" className="hidden bg-sidebar lg:block">
          <div className="sticky top-0 h-dvh">
            <SidebarContent profile={profile} active={module} />
          </div>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="relative flex h-18 shrink-0 items-center gap-3 border-b border-line bg-bg px-4 sm:gap-4 sm:px-8">
            <MobileNav>
              <SidebarContent profile={profile} active={module} />
            </MobileNav>
            <h1 className="m-0 min-w-0 flex-1 truncate font-display text-[clamp(1.25rem,4vw,1.625rem)] leading-tight font-bold tracking-[-0.025em]">
              {title}
            </h1>
            <TopbarTools entries={entries} unread={profile.counts.messages ?? 0} inbox={profile.nav.includes("messages") ? `/${MODULES.messages.slug}` : null} />
          </header>
          <main id="contenu" tabIndex={-1} className="min-w-0 flex-1 px-4 py-5 outline-none sm:px-8 sm:py-7">
            {/* Responsable de plusieurs enfants : le choix reste accessible sur toutes les pages. */}
            {module !== "dash" && profile.children.length > 1 && profile.student && (
              <div className="mb-5 flex justify-end">
                <ChildSelector students={profile.children} currentId={profile.student.id} />
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
