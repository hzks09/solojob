import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  return (
    <div className="min-h-screen">
      <DashboardNav plan={current.profile?.plan} />
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
