import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase "service role" — contourne RLS. SERVEUR UNIQUEMENT, jamais
 * importé dans un composant client. Utilisé pour les opérations privilégiées
 * (ex. webhook Stripe qui met à jour le plan d'un utilisateur).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
