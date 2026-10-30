import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Chiffres réels de la plateforme pour la landing. Chaque chiffre n'est affiché qu'au-dessus
 * d'un seuil : mieux vaut ne rien montrer qu'un zéro qui décrédibilise.
 */
export type TrustStats = { verifiedProviders: number; completedOrders: number; reviews: number };

export const TRUST_THRESHOLDS = { verifiedProviders: 10, completedOrders: 20, reviews: 10 } as const;

export async function getTrustStats(): Promise<TrustStats> {
  const db = createAdminClient();
  const head = { count: "exact" as const, head: true };
  const [verified, completed, reviews] = await Promise.all([
    db.from("profiles").select("id", head).in("role", ["provider", "both"]).eq("verification_status", "verified"),
    db.from("orders").select("id", head).eq("status", "completed"),
    db.from("reviews").select("id", head),
  ]);
  return {
    verifiedProviders: verified.count ?? 0,
    completedOrders: completed.count ?? 0,
    reviews: reviews.count ?? 0,
  };
}
