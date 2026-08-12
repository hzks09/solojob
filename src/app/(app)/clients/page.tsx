import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listClients } from "@/lib/actions/clients";

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-muted">{clients.length} client(s)</p>
        </div>
        <Link href="/clients/new" className={buttonVariants()}>
          Nouveau client
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted">
            Aucun client pour l&apos;instant. Ajoute ton premier client pour créer un devis.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/clients/${c.id}`}>
              <Card className="h-full transition-colors hover:border-brand">
                <CardContent className="pt-6">
                  <p className="font-medium">{c.nom}</p>
                  {c.email && <p className="mt-1 text-sm text-muted">{c.email}</p>}
                  {c.telephone && <p className="text-sm text-muted">{c.telephone}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
