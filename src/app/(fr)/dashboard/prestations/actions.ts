"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toMinor } from "@/lib/money";
import { getDashboardTexts } from "@/i18n/dashboard";
import { UUID_RE } from "@/lib/orders";

type PackageInput = {
  tier: 1 | 2 | 3;
  name: string;
  description: string;
  price_minor: number;
  delivery_days: number;
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
  if (priceMinor < 1000n || priceMinor > 10_000_000n) {
    return { error: e.priceRange };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    provider_id: user.id,
    category_id: categoryId,
    title,
    description,
    price_minor: priceMinor.toString(),
    currency: "XOF",
    delivery_days: deliveryDays,
    content_locale: "fr",
    status: "draft",
    ...(coverUrl ? { cover_url: coverUrl } : {}),
  });
  if (error) return { error: e.save };

  revalidatePath("/dashboard/prestations");
  return { success: true };
}

export async function updateService(id: string, formData: FormData) {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).services.errors;
  if (!isProvider(user.role)) return { error: e.notProvider };

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
  if (priceMinor < 1000n || priceMinor > 10_000_000n) return { error: e.priceRange };

  const supabase = await createClient();
  const { error } = await supabase
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
    })
    .eq("id", id)
    .eq("provider_id", user.id);

  if (error) return { error: e.update };

  revalidatePath("/dashboard/prestations");
  return { success: true };
}

export async function toggleServiceStatus(id: string, currentStatus: string) {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).services.errors;
  if (!isProvider(user.role)) return { error: e.notProvider };

  const newStatus = currentStatus === "active" ? "paused" : currentStatus === "paused" ? "active" : null;
  if (!newStatus) return { error: e.toggle };

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ status: newStatus })
    .eq("id", id)
    .eq("provider_id", user.id);

  if (error) return { error: e.toggle };

  revalidatePath("/dashboard/prestations");
  return { success: true };
}

export async function upsertPackages(serviceId: string, packages: PackageInput[]) {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).services.errors;
  if (!isProvider(user.role)) return { error: e.notProvider };
  if (!UUID_RE.test(serviceId)) return { error: e.notOwner };

  const db = createAdminClient();
  const { data: svc } = await db.from("services").select("provider_id").eq("id", serviceId).maybeSingle();
  if (!svc || svc.provider_id !== user.id) return { error: e.notOwner };

  const enabledTiers = packages.map((p) => p.tier);

  // Delete packages not in the enabled list
  if (enabledTiers.length < 3) {
    const tiersToDelete = ([1, 2, 3] as const).filter((t) => !enabledTiers.includes(t));
    await db.from("service_packages").delete().eq("service_id", serviceId).in("tier", tiersToDelete);
  }

  if (packages.length > 0) {
    const rows = packages.map((p) => ({
      service_id: serviceId,
      tier: p.tier,
      name: p.name.trim().slice(0, 60),
      description: p.description.trim().slice(0, 500) || null,
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("provider_id", user.id)
    .in("status", ["draft", "paused"]);

  if (error) return { error: e.delete };

  revalidatePath("/dashboard/prestations");
  return { success: true };
}
