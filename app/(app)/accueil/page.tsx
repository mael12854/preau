import type { Metadata } from "next";
import { StaffDashboard } from "@/components/screens/dashboard-staff";
import { StudentDashboard } from "@/components/screens/dashboard-student";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const profile = await requireModule("dash");
  return (
    <AppShell profile={profile} module="dash">
      {profile.staff ? <StaffDashboard profile={profile} /> : <StudentDashboard profile={profile} />}
    </AppShell>
  );
}
