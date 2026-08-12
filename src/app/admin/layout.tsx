import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { href: "/admin", label: "Statistiques" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/subscriptions", label: "Abonnements" },
  { href: "/admin/content", label: "Contenus" },
  { href: "/admin/reports", label: "Signalements" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
        <nav className="mt-4 flex flex-wrap gap-2">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("rounded-full border border-card-border px-4 py-1.5 text-sm hover:bg-card")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
