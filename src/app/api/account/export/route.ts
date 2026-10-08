import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Export des données du compte connecté (RGPD). On passe par le client de session :
 * la RLS ne rend visibles que les lignes de cet utilisateur, donc aucune clé service ici.
 */
export const dynamic = "force-dynamic";

/**
 * `key` : nom dans l'export. `from` : table réelle. `select` : colonnes lues, explicites
 * quand la table n'est pas accordée en entier (provider_profiles, voir 0001 et 0006).
 * `filter` vide = la RLS suffit.
 */
const PROVIDER_PROFILE_COLUMNS =
  "id, profile_id, headline, bio, content_locale, city, rating_avg, rating_count, completed_orders, created_at, payout_channel, payout_msisdn, payout_verified_at";

const TABLES: { key: string; from: string; select?: string; filter: (userId: string) => string }[] = [
  { key: "profile", from: "profiles", filter: (id) => `id.eq.${id}` },
  {
    key: "providerProfile",
    from: "provider_profiles",
    select: PROVIDER_PROFILE_COLUMNS,
    filter: (id) => `profile_id.eq.${id}`,
  },
  { key: "services", from: "services", filter: (id) => `provider_id.eq.${id}` },
  { key: "orders", from: "orders", filter: (id) => `client_id.eq.${id},provider_id.eq.${id}` },
  { key: "messages", from: "messages", filter: () => "" },
  { key: "reviews", from: "reviews", filter: (id) => `client_id.eq.${id},provider_id.eq.${id}` },
  { key: "disputes", from: "disputes", filter: () => "" },
  { key: "ledgerEntries", from: "ledger_entries", filter: (id) => `profile_id.eq.${id}` },
  { key: "payouts", from: "payouts", filter: (id) => `provider_id.eq.${id}` },
  { key: "verifications", from: "verifications", filter: (id) => `profile_id.eq.${id}` },
];

/** Chemins de fichiers et champs internes : inutiles dans un export lisible. */
function scrub(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !/path/i.test(key)));
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const supabase = await createClient();
  const data: Record<string, unknown> = {};

  for (const table of TABLES) {
    // Les tables sans filtre explicite sont déjà limitées par la RLS (participants).
    let query = supabase.from(table.from).select(table.select ?? "*");
    const filter = table.filter(user.id);
    if (filter) query = query.or(filter);
    const { data: rows, error } = await query;
    if (error) return new Response("Export impossible, réessayez.", { status: 500 });
    const list = (rows ?? []) as unknown as Record<string, unknown>[];
    data[table.key] = list.map(scrub);
  }

  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), account: user.id, data },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="toomny-export-${user.id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
