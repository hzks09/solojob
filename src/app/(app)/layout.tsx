import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { ConfirmedToast } from "@/components/auth/confirmed-toast";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const justConfirmed = (await cookies()).has("just_confirmed");

  return (
    <div className="min-h-screen">
      <ConfirmedToast show={justConfirmed} />
      <DashboardNav plan={current.profile?.plan} isAdmin={current.profile?.isAdmin} />
      <main className="mx-auto max-w-6xl px-4 py-10 pb-24 md:pb-10">{children}</main>
    </div>
  );
}
