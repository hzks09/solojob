import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <div>
      <h1 className="mb-8 font-display text-2xl font-black tracking-tight">Nouveau client</h1>
      <ClientForm />
    </div>
  );
}
