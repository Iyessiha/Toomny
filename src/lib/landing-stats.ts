import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Chiffres réels de la plateforme pour la landing. Chaque chiffre n'est affiché qu'au-dessus
 * d'un seuil : mieux vaut ne rien montrer qu'un zéro qui décrédibilise.
 */
export type TrustStats = { completedOrders: number; reviews: number };

export const TRUST_THRESHOLDS = { completedOrders: 20, reviews: 10 } as const;

export async function getTrustStats(): Promise<TrustStats> {
  const db = createAdminClient();
  const head = { count: "exact" as const, head: true };
  const [completed, reviews] = await Promise.all([
    db.from("orders").select("id", head).eq("status", "completed"),
    db.from("reviews").select("id", head),
  ]);
  return {
    completedOrders: completed.count ?? 0,
    reviews: reviews.count ?? 0,
  };
}
