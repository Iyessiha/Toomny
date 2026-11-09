"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, isProvider, type CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getCategories } from "@/lib/catalog";
import { maxServicesForPlan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { callClaude } from "@/lib/ai/claude";
import {
  PROFILE_SCHEMA,
  SERVICES_PER_RUN,
  SERVICES_SCHEMA,
  buildProfilePrompt,
  buildServicesPrompt,
  hasAiAccess,
  sanitizeProfileDraft,
  sanitizeServiceDrafts,
  validateAssistDescription,
  type ProfileDraft,
} from "@/lib/provider-assist";

/** Assistant IA : 20 appels par heure et par prestataire, pour borner le coût. */
const AI_MAX_PER_HOUR = 20;
const HOUR_SECONDS = 60 * 60;

const MSG = {
  fr: {
    notProvider: "Espace réservé aux prestataires.",
    notPremium: "L'assistant IA est inclus dans les plans Essentiel, Pro et Expert.",
    limit: "Vous avez atteint la limite d'utilisation de l'assistant pour cette heure. Réessayez plus tard.",
    planLimit: "Vous avez atteint le nombre de prestations de votre plan. Passez à un plan supérieur ou retirez-en une.",
    noResult: "L'assistant n'a pas pu proposer de prestations exploitables. Précisez votre activité et réessayez.",
    save: "L'enregistrement des prestations a échoué. Réessayez.",
  },
  en: {
    notProvider: "This area is for providers.",
    notPremium: "The AI assistant is included in the Essentiel, Pro and Expert plans.",
    limit: "You have reached the assistant limit for this hour. Please try again later.",
    planLimit: "You have reached the number of services allowed by your plan. Upgrade or remove one.",
    noResult: "The assistant could not propose usable services. Describe your activity more precisely and try again.",
    save: "Saving the services failed. Please try again.",
  },
} as const;

type Guard =
  | { ok: false; error: string }
  | { ok: true; user: CurrentUser; plan: string | null; planExpiresAt: string | null; m: { readonly [K in keyof (typeof MSG)["fr"]]: string } };

/** Contrôle commun : prestataire, plan payé actif, quota horaire. */
async function guard(): Promise<Guard> {
  const user = await requireAuth();
  const m = MSG[user.preferredLocale];
  if (!isProvider(user.role)) return { ok: false, error: m.notProvider };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("provider_profiles")
    .select("plan, plan_expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!hasAiAccess(profile?.plan, profile?.plan_expires_at ?? null)) {
    return { ok: false, error: m.notPremium };
  }

  const allowed = await consumeRateLimit(`ai:assist:${user.id}`, AI_MAX_PER_HOUR, HOUR_SECONDS);
  if (!allowed) return { ok: false, error: m.limit };

  return {
    ok: true,
    user,
    plan: profile?.plan ?? null,
    planExpiresAt: profile?.plan_expires_at ?? null,
    m,
  };
}

/** Propose un profil à partir d'une description libre. Rien n'est enregistré : le prestataire relit et enregistre. */
export async function generateProfileWithAi(
  input: string,
): Promise<{ draft: ProfileDraft } | { error: string }> {
  const g = await guard();
  if (!g.ok) return { error: g.error };

  const described = validateAssistDescription(input);
  if ("error" in described) return { error: described.error };

  const locale = g.user.preferredLocale;
  const { system, user } = buildProfilePrompt(described.text, locale);
  const result = await callClaude({ system, user, maxTokens: 1200, schema: PROFILE_SCHEMA });
  if (!result.ok) return { error: result.error };

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    return { error: g.m.noResult };
  }
  const draft = sanitizeProfileDraft(parsed);
  return draft ? { draft } : { error: g.m.noResult };
}

/** Crée jusqu'à SERVICES_PER_RUN prestations en brouillon, dans la limite du plan. La publication passe toujours par la modération. */
export async function createServicesWithAi(
  input: string,
): Promise<{ created: number } | { error: string }> {
  const g = await guard();
  if (!g.ok) return { error: g.error };

  const described = validateAssistDescription(input);
  if ("error" in described) return { error: described.error };

  const db = createAdminClient();
  const { count: activeCount } = await db
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", g.user.id)
    .not("status", "eq", "removed");
  const remaining = maxServicesForPlan(g.plan, g.planExpiresAt) - (activeCount ?? 0);
  if (remaining <= 0) return { error: g.m.planLimit };

  const count = Math.min(SERVICES_PER_RUN, remaining);
  const categories = await getCategories();
  const locale = g.user.preferredLocale;
  const categoryList = categories.map((c) => ({ slug: c.slug, name: locale === "en" ? c.name_en : c.name_fr }));
  const { system, user } = buildServicesPrompt(described.text, categoryList, count, locale);
  const result = await callClaude({ system, user, maxTokens: 3000, schema: SERVICES_SCHEMA });
  if (!result.ok) return { error: result.error };

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    return { error: g.m.noResult };
  }
  const drafts = sanitizeServiceDrafts(parsed, categories, count);
  if (drafts.length === 0) return { error: g.m.noResult };

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert(
    drafts.map((d) => ({
      provider_id: g.user.id,
      category_id: d.categoryId,
      title: d.title,
      description: d.description,
      price_minor: String(d.priceXof),
      currency: "XOF",
      delivery_days: d.deliveryDays,
      content_locale: locale,
      status: "draft",
      ...(d.tags.length ? { tags: d.tags } : {}),
    })),
  );
  if (error) {
    console.error("createServicesWithAi:", error.message);
    return { error: g.m.save };
  }

  revalidatePath("/dashboard/prestations");
  return { created: drafts.length };
}
