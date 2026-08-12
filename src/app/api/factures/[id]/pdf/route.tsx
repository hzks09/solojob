import { renderToBuffer } from "@react-pdf/renderer";
import { getFactureWithLignes } from "@/lib/actions/factures";
import { getCurrentUser } from "@/lib/auth/current-user";
import { FacturePdf } from "@/lib/pdf/facture-pdf";

/**
 * Génère le PDF à la volée à chaque téléchargement — jamais stocké sur
 * Supabase Storage (pour rester dans le tier gratuit quel que soit le nombre
 * de factures).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser();
  if (!current) return new Response("Non authentifié", { status: 401 });

  const { id } = await params;
  const result = await getFactureWithLignes(id);
  if (!result) return new Response("Facture introuvable", { status: 404 });

  const buffer = await renderToBuffer(
    <FacturePdf facture={result.facture} lignes={result.lignes} client={result.client} profile={current.profile} />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.facture.numero}.pdf"`,
    },
  });
}
