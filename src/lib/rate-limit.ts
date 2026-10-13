import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Compteur de tentatives partagé entre toutes les instances (stockage en base :
 * les fonctions serverless ne partagent pas la mémoire). Une clé = une fenêtre.
 * En cas d'erreur de la base, on laisse passer et on journalise : la disponibilité
 * de la connexion prime sur le compteur.
 */
export async function consumeRateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("consume_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("consumeRateLimit:", error.message);
    // Fail-closed : en cas d'erreur DB, on bloque plutôt que de laisser passer.
    return false;
  }
  return data === true;
}
