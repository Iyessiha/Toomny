"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAdminAction } from "@/lib/admin-audit";
import { notify } from "@/lib/notifications";
import { sendServicePublishedEmail } from "@/lib/email";
import { isRejectionReason, type RejectionReason } from "@/i18n/listing-guide";
import { reviewServiceText } from "@/lib/ai/service-review";
import {
  deterministicPoints,
  mergePoints,
  parseAiPoints,
  pointsAsNotes,
  reasonMessage,
  reviewVerdict,
  type ReviewPoint,
  type ReviewVerdict,
} from "@/lib/service-review";

const MODERATION_STATUSES = ["active", "paused", "removed", "draft"] as const;
type ModerationStatus = (typeof MODERATION_STATUSES)[number];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Modération d'une prestation : publier, mettre en pause, retirer ou repasser en brouillon.
 * Seul l'admin peut passer une prestation en « active » : c'est le point de contrôle
 * qui empêche un prestataire de se publier lui-même.
 */
export async function moderateService(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = String(formData.get("serviceId") ?? "");
  const status = String(formData.get("status") ?? "") as ModerationStatus;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return;
  if (!MODERATION_STATUSES.includes(status)) return;

  const db = createAdminClient();
  const { data: service } = await db
    .from("services")
    .select("provider_id, title")
    .eq("id", id)
    .maybeSingle();

  // Pas de publication tant que l'identité du prestataire n'est pas vérifiée.
  if (status === "active" && service) {
    const { data: prov } = await db
      .from("profiles")
      .select("verification_status")
      .eq("id", service.provider_id)
      .maybeSingle();
    if (prov?.verification_status !== "verified") redirect("/admin/services?error=kyc");
  }

  const { error } = await db
    .from("services")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("moderateService:", error.message);
    return;
  }

  if (service && status === "active") {
    // Publication : notification en ligne + e-mail dédié, avec l'incitation à booster.
    await notify(db, {
      recipientId: service.provider_id,
      type: "service_approved",
      params: { service: service.title ?? undefined },
      link: "/dashboard/prestations",
      sendEmail: false,
    });
    const [{ data: author }, { data: prof }] = await Promise.all([
      db.auth.admin.getUserById(service.provider_id),
      db.from("profiles").select("first_name, preferred_locale").eq("id", service.provider_id).maybeSingle(),
    ]);
    if (author?.user?.email) {
      await sendServicePublishedEmail({
        to: author.user.email,
        firstName: prof?.first_name ?? "",
        serviceTitle: service.title ?? "",
        serviceId: id,
        locale: prof?.preferred_locale === "en" ? "en" : "fr",
      });
    }
  } else if (service && status === "removed") {
    await notify(db, {
      recipientId: service.provider_id,
      type: "service_removed",
      params: { service: service.title ?? undefined },
      link: "/dashboard/prestations",
    });
  }

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "service.moderate",
    targetType: "service",
    targetId: id,
    details: { status },
  });

  revalidatePath("/admin/services");
  revalidatePath("/services");
}

export async function editService(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();

  const id = String(formData.get("serviceId") ?? "");
  if (!UUID_RE.test(id)) return { error: "invalid id" };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = Number(formData.get("price_minor"));
  const deliveryRaw = Number(formData.get("delivery_days"));
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as ModerationStatus;

  if (!title) return { error: "title required" };
  if (!MODERATION_STATUSES.includes(status)) return { error: "invalid status" };

  const db = createAdminClient();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (title) update.title = title;
  if (description) update.description = description;
  if (!isNaN(priceRaw) && priceRaw > 0) update.price_minor = Math.round(priceRaw);
  if (!isNaN(deliveryRaw) && deliveryRaw > 0) update.delivery_days = Math.round(deliveryRaw);
  if (categoryId && UUID_RE.test(categoryId)) update.category_id = categoryId;
  if (status) update.status = status;

  const { error } = await db.from("services").update(update).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${id}`);
  revalidatePath("/services");
  revalidatePath(`/services/${id}`);
  return {};
}

/**
 * Refus d'une prestation en brouillon : motifs cochés + message optionnel.
 * Le prestataire reçoit une notification et un e-mail qui explique comment rédiger une annonce complète.
 */
export async function rejectService(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = String(formData.get("serviceId") ?? "");
  if (!UUID_RE.test(id)) return;

  const reasons = formData.getAll("reasons").map(String).filter(isRejectionReason);
  if (reasons.length === 0) redirect(`/admin/services/${id}?error=reason`);

  const message = String(formData.get("message") ?? "").trim().slice(0, 1000);

  const db = createAdminClient();
  const { data: service } = await db
    .from("services")
    .select("provider_id, title, status")
    .eq("id", id)
    .maybeSingle();

  if (!service || service.status !== "draft") redirect(`/admin/services/${id}?error=status`);

  // Notification dans l'application uniquement : les points sont sur la prestation.
  await notify(db, {
    recipientId: service.provider_id,
    type: "service_changes_requested",
    params: { service: service.title ?? undefined },
    link: "/dashboard/prestations",
    sendEmail: false,
  });

  // Points enregistrés sur la prestation : le prestataire les retrouve pour corriger.
  const notes = pointsAsNotes([
    ...reasons.map((r) => ({ reason: r as RejectionReason, message: reasonMessage(r as RejectionReason) })),
    ...(message ? [{ reason: "other" as RejectionReason, message }] : []),
  ]);
  await db.from("services").update({ review_notes: notes, review_requested_at: null }).eq("id", id);



  await recordAdminAction(db, {
    actorId: admin.id,
    action: "service.reject",
    targetType: "service",
    targetId: id,
    details: { reasons, hasMessage: message.length > 0 },
  });

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${id}`);
  redirect(`/admin/services/${id}?refused=1`);
}

/**
 * Analyse une prestation soumise : contrôles objectifs (couverture, description,
 * coordonnées, titre, prix, catégorie) fusionnés avec la lecture de l'IA. Rien n'est
 * modifié : l'équipe décide de valider ou de refuser avec ces points.
 */
export async function analyzeServiceListing(
  serviceId: string,
): Promise<ReviewVerdict | { error: string }> {
  await requireAdmin();
  if (!UUID_RE.test(serviceId)) return { error: "Prestation introuvable." };

  const db = createAdminClient();
  const { data: service } = await db
    .from("services")
    .select("title, description, price_minor, delivery_days, category_id, cover_url, gallery_urls, provider_id")
    .eq("id", serviceId)
    .maybeSingle();
  if (!service) return { error: "Prestation introuvable." };

  const [{ data: category }, { count: packagesCount }, { data: provider }] = await Promise.all([
    service.category_id
      ? db.from("categories").select("name_fr, name_en").eq("id", service.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    db.from("service_packages").select("id", { count: "exact", head: true }).eq("service_id", serviceId),
    db.from("profiles").select("preferred_locale").eq("id", service.provider_id).maybeSingle(),
  ]);
  const locale = provider?.preferred_locale === "en" ? "en" : "fr";

  const facts = {
    title: service.title ?? "",
    description: service.description ?? "",
    priceMinor: Number(service.price_minor),
    deliveryDays: Number(service.delivery_days),
    categoryId: service.category_id ?? null,
    coverUrl: service.cover_url ?? null,
    galleryUrls: (service.gallery_urls ?? []) as string[],
    packagesCount: packagesCount ?? 0,
  };
  const deterministic = deterministicPoints(facts);

  const ai = await reviewServiceText({
    ...facts,
    categoryName: category ? (locale === "en" ? category.name_en : category.name_fr) : null,
    locale,
  });
  if ("error" in ai) return { error: ai.error };

  const points: ReviewPoint[] = mergePoints(deterministic, parseAiPoints(ai));
  return reviewVerdict(points);
}
