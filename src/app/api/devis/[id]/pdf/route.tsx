import { renderToBuffer } from "@react-pdf/renderer";
import { getDevisWithLignes } from "@/lib/actions/devis";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DevisPdf } from "@/lib/pdf/devis-pdf";

/**
 * Génère le PDF à la volée à chaque téléchargement — jamais stocké sur
 * Supabase Storage (même logique que le PDF de facture).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser();
  if (!current) return new Response("Non authentifié", { status: 401 });

  const { id } = await params;
  const result = await getDevisWithLignes(id);
  if (!result) return new Response("Devis introuvable", { status: 404 });

  const buffer = await renderToBuffer(
    <DevisPdf devis={result.devis} lignes={result.lignes} client={result.client} profile={current.profile} />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.devis.numero}.pdf"`,
    },
  });
}
