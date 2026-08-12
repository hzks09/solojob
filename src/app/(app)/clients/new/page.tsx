import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Nouveau client</h1>
      <ClientForm />
    </div>
  );
}
