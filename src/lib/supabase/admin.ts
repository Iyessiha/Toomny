import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client à clé de service : il contourne RLS.
 *
 * À n'utiliser QUE côté serveur, et QUE après un contrôle d'autorisation
 * explicite dans le code — soit `requireAdmin()`, soit la vérification que
 * l'appelant est partie prenante (propriétaire de la prestation, client ou
 * prestataire de la commande…). On a préféré ce contrôle explicite à des
 * policies « ou alors admin » sur chaque table : une policy trop permissive
 * s'oublie, un appel à `requireAdmin()` se relit.
 *
 * Quand la RLS suffit (lecture de ses propres lignes, écriture propriétaire
 * déjà encadrée par une politique), préférer le client de session
 * (`@/lib/supabase/server`) : deux couches de contrôle valent mieux qu'une.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante.");

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
