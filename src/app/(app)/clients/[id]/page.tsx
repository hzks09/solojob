import { notFound } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import { getClient } from "@/lib/actions/clients";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">{client.nom}</h1>
      <ClientForm client={client} />
    </div>
  );
}
