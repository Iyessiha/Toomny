"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, isProvider } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_RE } from "@/lib/orders";
import { hasPaidPlan } from "@/lib/plans";
import { MAX_ADDONS_PER_SERVICE, validateAddon } from "@/lib/service-addons";
import { getAddonTexts } from "@/i18n/addons";

type Result = { error: string } | { success: true };

/** Vrai si le prestataire connecté a un plan payant en cours. Lu côté serveur, jamais depuis le navigateur. */
async function hasPaidPlanFor(userId: string): Promise<boolean> {
  const db = createAdminClient();
  const { data } = await db
    .from("provider_profiles")
    .select("plan, plan_expires_at")
    .eq("profile_id", userId)
    .maybeSingle();
  return hasPaidPlan(data?.plan, data?.plan_expires_at ?? null);
}

/** Ajoute un supplément à une prestation du prestataire connecté. */
export async function createServiceAddon(
  serviceId: string,
  input: { title: string; description: string; priceRaw: string; extraDays: number },
): Promise<Result> {
  const user = await requireAuth();
  const t = getAddonTexts(user.preferredLocale);
  if (!isProvider(user.role) || !UUID_RE.test(serviceId)) return { error: t.errors.notOwner };

  const db = createAdminClient();
  const { data: service } = await db.from("services").select("id, provider_id").eq("id", serviceId).maybeSingle();
  if (!service || service.provider_id !== user.id) return { error: t.errors.notOwner };
  if (!(await hasPaidPlanFor(user.id))) return { error: t.errors.locked };

  const { count } = await db
    .from("service_addons")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId);
  if ((count ?? 0) >= MAX_ADDONS_PER_SERVICE) return { error: t.limit(MAX_ADDONS_PER_SERVICE) };

  const checked = validateAddon(input);
  if (!checked.ok) return { error: t.errors[checked.error] };

  const { error } = await db.from("service_addons").insert({
    service_id: serviceId,
    provider_id: user.id,
    title: checked.value.title,
    description: checked.value.description,
    price_minor: checked.value.priceMinor.toString(),
    currency: "XOF",
    extra_delivery_days: checked.value.extraDays,
    active: true,
  });
  if (error) {
    console.error("createServiceAddon:", error.message);
    return { error: t.errors.save };
  }

  revalidatePath(`/dashboard/prestations/${serviceId}/supplements`);
  revalidatePath(`/services/${serviceId}`);
  return { success: true };
}

/** Affiche ou masque un supplément, sans le supprimer. */
export async function setServiceAddonActive(addonId: string, active: boolean): Promise<Result> {
  return updateOwnedAddon(addonId, async (db) => db.from("service_addons").update({ active }).eq("id", addonId));
}

/** Supprime un supplément. Les commandes passées gardent leur copie figée. */
export async function deleteServiceAddon(addonId: string): Promise<Result> {
  return updateOwnedAddon(addonId, async (db) => db.from("service_addons").delete().eq("id", addonId));
}

async function updateOwnedAddon(
  addonId: string,
  change: (db: ReturnType<typeof createAdminClient>) => PromiseLike<{ error: { message: string } | null }>,
): Promise<Result> {
  const user = await requireAuth();
  const t = getAddonTexts(user.preferredLocale);
  if (!isProvider(user.role) || !UUID_RE.test(addonId)) return { error: t.errors.notOwner };

  const db = createAdminClient();
  const { data: addon } = await db.from("service_addons").select("id, provider_id, service_id").eq("id", addonId).maybeSingle();
  if (!addon || addon.provider_id !== user.id) return { error: t.errors.notOwner };

  const { error } = await change(db);
  if (error) {
    console.error("updateOwnedAddon:", error.message);
    return { error: t.errors.save };
  }

  revalidatePath(`/dashboard/prestations/${addon.service_id}/supplements`);
  revalidatePath(`/services/${addon.service_id}`);
  return { success: true };
}
