"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, isProvider } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_RE } from "@/lib/orders";
import { MAX_PORTFOLIO_ITEMS, validatePortfolioItem } from "@/lib/portfolio";
import { getShowcaseTexts } from "@/i18n/showcase";

type Result = { error: string } | { success: true };

/** Enregistre le statut du prestataire : particulier, ou entreprise avec son nom. */
export async function saveBusiness(input: { businessType: string; companyName: string }): Promise<Result> {
  const user = await requireAuth();
  const t = getShowcaseTexts(user.preferredLocale);
  if (!isProvider(user.role)) return { error: t.errors.notProvider };

  const isCompany = input.businessType === "company";
  if (input.businessType !== "company" && input.businessType !== "individual") return { error: t.errors.save };
  const companyName = input.companyName.trim();
  if (isCompany && (companyName.length < 2 || companyName.length > 120)) return { error: t.errors.companyName };

  const db = createAdminClient();
  const { error } = await db
    .from("provider_profiles")
    .update({
      business_type: isCompany ? "company" : "individual",
      company_name: isCompany ? companyName : null,
    })
    .eq("profile_id", user.id);
  if (error) {
    console.error("saveBusiness:", error.message);
    return { error: t.errors.save };
  }

  revalidatePath("/dashboard/vitrine");
  revalidatePath(`/prestataires/${user.id}`);
  return { success: true };
}

/** Ajoute une réalisation (vidéo, travail ou lien) à la vitrine. */
export async function addPortfolioItem(input: {
  kind: string;
  title: string;
  description: string;
  url: string;
}): Promise<Result> {
  const user = await requireAuth();
  const t = getShowcaseTexts(user.preferredLocale);
  if (!isProvider(user.role)) return { error: t.errors.notProvider };

  const checked = validatePortfolioItem(input);
  if (!checked.ok) return { error: t.errors[checked.error] };

  const db = createAdminClient();
  const { count } = await db.from("portfolio_items").select("id", { count: "exact", head: true }).eq("provider_id", user.id);
  if ((count ?? 0) >= MAX_PORTFOLIO_ITEMS) return { error: t.limit(MAX_PORTFOLIO_ITEMS) };

  const { error } = await db.from("portfolio_items").insert({ provider_id: user.id, ...checked.value });
  if (error) {
    console.error("addPortfolioItem:", error.message);
    return { error: t.errors.save };
  }

  revalidatePath("/dashboard/vitrine");
  revalidatePath(`/prestataires/${user.id}`);
  return { success: true };
}

/** Retire une réalisation de sa vitrine. */
export async function removePortfolioItem(itemId: string): Promise<Result> {
  const user = await requireAuth();
  const t = getShowcaseTexts(user.preferredLocale);
  if (!isProvider(user.role) || !UUID_RE.test(itemId)) return { error: t.errors.save };

  const db = createAdminClient();
  const { error } = await db.from("portfolio_items").delete().eq("id", itemId).eq("provider_id", user.id);
  if (error) {
    console.error("removePortfolioItem:", error.message);
    return { error: t.errors.save };
  }

  revalidatePath("/dashboard/vitrine");
  revalidatePath(`/prestataires/${user.id}`);
  return { success: true };
}
