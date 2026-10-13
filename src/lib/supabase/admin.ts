import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client à clé de service : il contourne RLS.
 *
 * À n'utiliser QUE côté serveur, et QUE après avoir vérifié que l'appelant est
 * administrateur. On a préféré ce passage explicite à des policies « ou alors
 * admin » sur chaque table : une policy trop permissive s'oublie, un appel à
 * `requireAdmin()` se relit.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante.");

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
