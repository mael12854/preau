import type { ReactNode } from "react";
import { moduleLabel, type ModuleKey, type Profile } from "@/lib/mock/profiles";
import { MobileNav } from "./mobile-nav";
import { SidebarContent } from "./sidebar";
import { SkipLink } from "./skip-link";
import { TopbarTools } from "./topbar-tools";

type AppShellProps = {
  profile: Profile;
  module: ModuleKey;
  children: ReactNode;
};

/** Coque : barre latérale 240 px, barre du haut 72 px, contenu 28 / 32. */
export function AppShell({ profile, module, children }: AppShellProps) {
  const title = moduleLabel(profile, module);
  return (
    <>
      <SkipLink />
      <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
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
            <TopbarTools />
          </header>
          <main id="contenu" tabIndex={-1} className="min-w-0 flex-1 px-4 py-5 outline-none sm:px-8 sm:py-7">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
