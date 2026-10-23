"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toMinor } from "@/lib/money";
import { parsePackages, type ValidPackage } from "@/lib/packages";
import { getDashboardTexts } from "@/i18n/dashboard";
import { UUID_RE } from "@/lib/orders";
import { maxServicesForPlan } from "@/lib/plans";

/** Entrée brute venue du navigateur : toujours revalidée par `parsePackages`. */
type PackageInput = {
  tier: unknown;
  name: unknown;
  description: unknown;
  price_minor: unknown;
  delivery_days: unknown;
};

/**
 * Créer une prestation en brouillon. Seul un prestataire peut le faire (RLS :
 * services_owner_insert exige le rôle provider et le statut draft). La
 * publication passe ensuite par la modération, côté serveur.
 */
export async function createService(formData: FormData) {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).services.errors;
  if (!isProvider(user.role)) return { error: e.notProvider };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const priceRaw = String(formData.get("price") ?? "").trim();
  const deliveryDays = Number(formData.get("deliveryDays"));
  const coverUrl = String(formData.get("coverUrl") ?? "").trim() || null;

  if (!title || title.length > 120) return { error: e.title };
  if (description.length < 30 || description.length > 3000) {
    return { error: e.description };
  }
  if (!categoryId) return { error: e.category };
  if (!Number.isInteger(deliveryDays) || deliveryDays < 1 || deliveryDays > 365) {
    return { error: e.deliveryRange };
  }

  let priceMinor: bigint;
  try {
    priceMinor = toMinor(priceRaw, "XOF");
  } catch {
    return { error: e.price };
  }
  if (priceMinor < 5000n || priceMinor > 10_000_000n) {
    return { error: e.priceRange };
  }

  const galleryRaw = String(formData.get("galleryUrls") ?? "").trim();
  const galleryUrls = galleryRaw
    ? galleryRaw.split(",").map((u) => u.trim()).filter(Boolean).slice(0, 4)
    : [];
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim().slice(0, 30)).filter(Boolean).slice(0, 10)
    : [];
  // Forfaits validés AVANT toute écriture : un JSON malformé ou des valeurs
  // hors bornes rejettent la création entière, sans prestation orpheline.
  let packages: ValidPackage[] = [];
  const packagesJson = String(formData.get("packagesJson") ?? "").trim();
  if (packagesJson) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(packagesJson);
    } catch {
      return { error: e.packages };
    }
    const checked = parsePackages(parsed);
    if (!checked) return { error: e.packages };
    packages = checked;
  }

  const db = createAdminClient();

  // Vérifier la limite de prestations du plan actuel.
  const { data: providerPlan } = await db
    .from("provider_profiles")
    .select("plan, plan_expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  const limit = maxServicesForPlan(providerPlan?.plan, providerPlan?.plan_expires_at);

  const { count: activeCount } = await db
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", user.id)
    .not("status", "eq", "removed");

  if ((activeCount ?? 0) >= limit) {
    return { error: e.planLimit };
  }

  const supabase = await createClient();
  const { data: newService, error } = await supabase
    .from("services")
    .insert({
      provider_id: user.id,
      category_id: categoryId,
      title,
      description,
      price_minor: priceMinor.toString(),
      currency: "XOF",
      delivery_days: deliveryDays,
      content_locale: user.preferredLocale,
      status: "draft",
      ...(coverUrl ? { cover_url: coverUrl } : {}),
      ...(galleryUrls.length ? { gallery_urls: galleryUrls } : {}),
      ...(tags.length ? { tags } : {}),
    })
    .select("id")
    .single();
  if (error || !newService) return { error: e.save };

  if (packages.length > 0) {
    const db = createAdminClient();
    const rows = packages.map((p) => ({
      service_id: newService.id,
      tier: p.tier,
      name: p.name,
      description: p.description,
      price_minor: p.price_minor,
      currency: "XOF",
      delivery_days: p.delivery_days,
    }));
    const { error: pkgErr } = await db.from("service_packages").insert(rows);
    if (pkgErr) {
      // Échec tardif (course, contrainte) : on retire le brouillon plutôt que
      // de laisser une prestation sans les forfaits annoncés.
      console.error("createService packages:", pkgErr.message);
      await db.from("services").delete().eq("id", newService.id);
      return { error: e.save };
    }
  }

  revalidatePath("/dashboard/prestations");
  return { success: true };
}

export async function updateService(id: string, formData: FormData) {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).services.errors;
  if (!isProvider(user.role)) return { error: e.notProvider };
  if (!UUID_RE.test(id)) return { error: e.notOwner };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const priceRaw = String(formData.get("price") ?? "").trim();
  const deliveryDays = Number(formData.get("deliveryDays"));
  const coverUrl = String(formData.get("coverUrl") ?? "").trim() || null;
  const galleryRaw = String(formData.get("galleryUrls") ?? "").trim();
  const galleryUrls = galleryRaw
    ? galleryRaw.split(",").map((u) => u.trim()).filter(Boolean).slice(0, 4)
    : [];
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim().slice(0, 30)).filter(Boolean).slice(0, 10)
    : [];

  if (!title || title.length > 120) return { error: e.title };
  if (description.length < 30 || description.length > 3000) return { error: e.description };
  if (!categoryId) return { error: e.category };
  if (!Number.isInteger(deliveryDays) || deliveryDays < 1 || deliveryDays > 365) return { error: e.deliveryRange };

  let priceMinor: bigint;
  try {
    priceMinor = toMinor(priceRaw, "XOF");
  } catch {
    return { error: e.price };
  }
  if (priceMinor < 5000n || priceMinor > 10_000_000n) return { error: e.priceRange };

  // Verify ownership and fetch current status
  const supabase = await createClient();
  const { data: owned } = await supabase
    .from("services")
    .select("id, status")
    .eq("id", id)
    .eq("provider_id", user.id)
    .maybeSingle();
  if (!owned) return { error: e.notOwner };

  // If the service is active, editing text/content fields requires re-moderation
  // to prevent bait-and-switch after admin approval.
  // Price and delivery_days changes are always immediate.
  const requiresReview = owned.status === "active";

  const db = createAdminClient();
  const { error } = await db
    .from("services")
    .update({
      category_id: categoryId,
      title,
      description,
      price_minor: priceMinor.toString(),
      delivery_days: deliveryDays,
      cover_url: coverUrl,
      gallery_urls: galleryUrls,
      tags,
      // Le statut « pending_review » n'existe pas dans l'enum : on repasse en brouillon, file de l'admin.
      ...(requiresReview ? { status: "draft" } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("provider_id", user.id);

  if (error) return { error: e.update };

  revalidatePath("/dashboard/prestations");
  return { success: true, pendingReview: requiresReview };
}

export async function toggleServiceStatus(id: string, currentStatus: string) {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).services.errors;
  if (!isProvider(user.role)) return { error: e.notProvider };

  // Le statut réel est lu en base : l'écran peut être en retard sur la prestation.
  // La mise à jour passe par la clé de service, car la règle RLS interdit de repasser en « active ».
  const db = createAdminClient();
  const { data: owned } = await db
    .from("services")
    .select("status")
    .eq("id", id)
    .eq("provider_id", user.id)
    .maybeSingle();
  if (!owned || owned.status !== currentStatus) return { error: e.toggle };

  const newStatus = owned.status === "active" ? "paused" : owned.status === "paused" ? "active" : null;
  if (!newStatus) return { error: e.toggle };

  const { error } = await db
    .from("services")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("provider_id", user.id)
    .eq("status", owned.status);

  if (error) return { error: e.toggle };

  revalidatePath("/dashboard/prestations");
  return { success: true };
}

export async function upsertPackages(serviceId: string, packages: PackageInput[]) {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).services.errors;
  if (!isProvider(user.role)) return { error: e.notProvider };
  if (!UUID_RE.test(serviceId)) return { error: e.notOwner };

  // L'argument transite par le réseau : mêmes contrôles qu'à la création.
  const checked = parsePackages(packages);
  if (!checked) return { error: e.packages };

  const db = createAdminClient();
  const { data: svc } = await db.from("services").select("provider_id").eq("id", serviceId).maybeSingle();
  if (!svc || svc.provider_id !== user.id) return { error: e.notOwner };

  const enabledTiers = checked.map((p) => p.tier);

  // Delete packages not in the enabled list
  if (enabledTiers.length < 3) {
    const tiersToDelete = ([1, 2, 3] as const).filter((t) => !enabledTiers.includes(t));
    await db.from("service_packages").delete().eq("service_id", serviceId).in("tier", tiersToDelete);
  }

  if (checked.length > 0) {
    const rows = checked.map((p) => ({
      service_id: serviceId,
      tier: p.tier,
      name: p.name,
      description: p.description,
      price_minor: p.price_minor,
      currency: "XOF",
      delivery_days: p.delivery_days,
    }));
    const { error } = await db
      .from("service_packages")
      .upsert(rows, { onConflict: "service_id,tier" });
    if (error) return { error: e.update };
  }

  revalidatePath("/dashboard/prestations");
  return { success: true };
}

export async function deleteService(id: string) {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).services.errors;
  if (!isProvider(user.role)) return { error: e.notProvider };

  // Pas de droit DELETE pour le rôle authentifié : la suppression passe par la clé de service,
  // limitée au propriétaire et aux statuts « brouillon » et « en pause ».
  const db = createAdminClient();
  const { data: deleted, error } = await db
    .from("services")
    .delete()
    .eq("id", id)
    .eq("provider_id", user.id)
    .in("status", ["draft", "paused"])
    .select("id");

  if (error || !deleted || deleted.length === 0) return { error: e.delete };

  revalidatePath("/dashboard/prestations");
  return { success: true };
}

/**
 * Soumet à nouveau une prestation retirée : elle repart en brouillon, dans la file de modération.
 * Seul le propriétaire peut le faire, et seulement depuis le statut « removed ».
 */
export async function resubmitService(id: string) {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).services.errors;
  if (!isProvider(user.role)) return { error: e.notProvider };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("provider_id", user.id)
    .eq("status", "removed")
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: e.toggle };

  revalidatePath("/dashboard/prestations");
  return { success: true };
}

/**
 * Le prestataire soumet (à nouveau) une prestation en brouillon à la validation de
 * l'équipe, après avoir corrigé les points signalés. Seules ses prestations en brouillon.
 */
export async function requestServiceReview(id: string) {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).services.errors;
  if (!isProvider(user.role)) return { error: e.notProvider };
  if (!UUID_RE.test(id)) return { error: e.toggle };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .update({ review_requested_at: new Date().toISOString() })
    .eq("id", id)
    .eq("provider_id", user.id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: e.toggle };

  revalidatePath("/dashboard/prestations");
  return { success: true };
}
