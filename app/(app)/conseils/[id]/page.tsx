import type { Metadata } from "next";
import Link from "next/link";
import { CouncilScreen } from "@/components/screens/conseil";
import { AppShell } from "@/components/shell/app-shell";
import { getCouncil } from "@/lib/data/councils";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Conseil de classe" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireModule("conseils");
  const { id } = await params;
  const council = await getCouncil(await createClient(), profile, id);
  return (
    <AppShell profile={profile} module="conseils">
      <div className="flex flex-col gap-4">
        <Link href="/conseils" className="w-fit text-label font-bold text-brand hover:underline">
          ← Tous les conseils
        </Link>
        {council ? (
          <CouncilScreen council={council} />
        ) : (
          <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
            Ce conseil n&apos;existe pas ou ne vous concerne pas.
          </p>
        )}
      </div>
    </AppShell>
  );
}
