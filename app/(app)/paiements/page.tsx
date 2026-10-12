import type { Metadata } from "next";
import { PaiementsScreen } from "@/components/screens/paiements";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getPayments } from "@/lib/data/school";
import { formatWeekday } from "@/lib/format";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Paiements & cantine" };

export default async function Page() {
  const profile = await requireModule("paiements");
  const reference = now();
  const data = await getPayments(await createClient(), profile.student?.id ?? null, reference);
  return (
    <AppShell profile={profile} module="paiements">
      <PaiementsScreen
        student={profile.student}
        balance={data.balance}
        menu={data.menu}
        menuDay={formatWeekday(reference)}
        bills={data.bills}
        pendingTopUps={data.pendingTopUps}
        canPay={profile.id === "parent"}
      />
    </AppShell>
  );
}
