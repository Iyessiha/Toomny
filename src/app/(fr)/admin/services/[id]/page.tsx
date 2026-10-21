import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCategories } from "@/lib/catalog";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { getAdminTexts } from "@/i18n/admin";
import { getListingGuideTexts, REJECTION_REASONS } from "@/i18n/listing-guide";
import { visitorLocale } from "@/i18n/server-locale";
import { ServiceEditForm } from "@/components/admin/service-edit-form";
import { Avatar, Notice, Pill, Section, serviceTone } from "@/components/dashboard/pro";
import { formatMoney } from "@/lib/money";
import { checkListing } from "@/lib/listing-checks";
import { moderateService, rejectService } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).serviceReviewPage.metaTitle };
}
export const dynamic = "force-dynamic";

export default async function AdminServiceReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ refused?: string; error?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).serviceReviewPage;
  const tStatus = getAdminTexts(locale).servicesPage;
  const tGuide = getListingGuideTexts(locale);
  const { id } = await params;
  const { refused, error } = await searchParams;

  const db = createAdminClient();
  const [{ data: service }, categories, { data: packages }] = await Promise.all([
    db
      .from("services")
      .select(
        "id, title, description, price_minor, currency, delivery_days, status, category_id, cover_url, gallery_urls, tags, provider:profiles!services_provider_id_profiles_id_fk(display_name, email)",
      )
      .eq("id", id)
      .maybeSingle(),
    getCategories(),
    db
      .from("service_packages")
      .select("tier, name, description, price_minor, currency, delivery_days")
      .eq("service_id", id)
      .order("tier"),
  ]);

  const nav = getAdminNavGroups(locale, "/admin/services");

  if (!service) {
    return (
      <AdminShell user={user} locale={locale} title="404" subtitle="" nav={nav}>
        <Notice tone="danger">Prestation introuvable.</Notice>
      </AdminShell>
    );
  }

  const provider = Array.isArray(service.provider) ? service.provider[0] : service.provider;
  const category = categories.find((c) => c.id === service.category_id);
  const categoryName = category ? (locale === "en" ? category.name_en : category.name_fr) : "—";
  const gallery = (service.gallery_urls ?? []) as string[];
  const checks = checkListing({
    description: service.description ?? "",
    coverUrl: service.cover_url,
    galleryUrls: gallery,
  });
  const checkLabel: Record<string, string> = {
    cover: t.checkCover,
    gallery: t.checkGallery,
    description: t.checkDescription,
    contact: t.checkContact,
  };
  const isDraft = service.status === "draft";

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={t.subtitle}
      nav={nav}
    >
      <div className="max-w-5xl space-y-6">
        <Link href="/admin/services" className="btn-ghost btn-sm">← {t.back}</Link>

        {refused && <Notice tone="success">{t.refuseDone}</Notice>}
        {error && <Notice tone="danger">{error === "reason" ? t.refuseNeedReason : "Action impossible."}</Notice>}

        {/* En-tête : prestataire, statut, actions */}
        <Section title={t.title}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={provider?.display_name ?? provider?.email} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{service.title}</p>
                <p className="truncate text-sm text-[var(--subtle)]">
                  {provider?.display_name ?? "—"} · {provider?.email}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={serviceTone(service.status)}>{tStatus.status[service.status] ?? service.status}</Pill>
              {service.status !== "active" && (
                <form action={moderateService}>
                  <input type="hidden" name="serviceId" value={service.id} />
                  <input type="hidden" name="status" value="active" />
                  <button type="submit" className="btn-primary btn-sm">{t.publish}</button>
                </form>
              )}
            </div>
          </div>
        </Section>

        {/* Contrôles automatiques */}
        <Section title={t.checksTitle}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {checks.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-sm">
                <Pill tone={c.ok ? "success" : "danger"}>{c.ok ? t.ok : t.ko}</Pill>
                {checkLabel[c.key]}
              </li>
            ))}
          </ul>
        </Section>

        {/* Photo de couverture */}
        <Section title={t.coverTitle}>
          {service.cover_url ? (
            <a href={service.cover_url} target="_blank" rel="noopener noreferrer" className="relative block aspect-video overflow-hidden rounded-xl bg-[var(--surface)]" aria-label={t.openImage}>
              <Image src={service.cover_url} alt={service.title} fill className="object-contain" sizes="(min-width: 1024px) 800px, 100vw" />
            </a>
          ) : (
            <Notice tone="danger">{t.noCover}</Notice>
          )}
        </Section>

        {/* Galerie */}
        <Section title={`${t.galleryTitle} (${gallery.length})`}>
          {gallery.length === 0 ? (
            <p className="text-sm text-[var(--subtle)]">{t.noGallery}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {gallery.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--surface)]" aria-label={t.openImage}>
                  <Image src={url} alt={`${service.title} — ${i + 2}`} fill className="object-cover" sizes="(min-width: 768px) 25vw, 50vw" />
                </a>
              ))}
            </div>
          )}
        </Section>

        {/* Informations */}
        <Section title={t.infoTitle}>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-[var(--subtle)]">{t.fieldCategory}</dt><dd className="font-medium">{categoryName}</dd></div>
            <div><dt className="text-[var(--subtle)]">{t.fieldPrice}</dt><dd className="font-medium">{formatMoney(BigInt(service.price_minor), service.currency, locale)}</dd></div>
            <div><dt className="text-[var(--subtle)]">{t.fieldDelivery}</dt><dd className="font-medium">{service.delivery_days} {locale === "en" ? "days" : "jours"}</dd></div>
            <div>
              <dt className="text-[var(--subtle)]">{t.fieldTags}</dt>
              <dd className="font-medium">{service.tags?.length ? service.tags.join(", ") : t.noTags}</dd>
            </div>
          </dl>
        </Section>

        {/* Description complète */}
        <Section title={t.descriptionTitle}>
          <p className="whitespace-pre-line text-sm leading-relaxed">{service.description || "—"}</p>
        </Section>

        {/* Forfaits */}
        <Section title={t.packagesTitle}>
          {!packages || packages.length === 0 ? (
            <p className="text-sm text-[var(--subtle)]">{t.noPackages}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {packages.map((p) => (
                <div key={p.tier} className="rounded-xl border border-[var(--border)] p-4">
                  <p className="font-semibold">{p.name}</p>
                  <p className="mt-1 text-sm text-[var(--subtle)] whitespace-pre-line">{p.description || "—"}</p>
                  <p className="mt-3 text-sm font-medium">
                    {formatMoney(BigInt(p.price_minor), p.currency, locale)} · {p.delivery_days} {locale === "en" ? "d" : "j"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Refus */}
        {isDraft && (
          <Section title={t.refuseTitle}>
            <form action={rejectService} className="space-y-4">
              <input type="hidden" name="serviceId" value={service.id} />
              <p className="text-sm text-[var(--subtle)]">{t.refuseIntro}</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {REJECTION_REASONS.map((r) => (
                  <li key={r}>
                    <label className="flex items-start gap-2 text-sm">
                      <input type="checkbox" name="reasons" value={r} className="mt-1" />
                      {tGuide.reasons[r]}
                    </label>
                  </li>
                ))}
              </ul>
              <div>
                <label className="label" htmlFor="refuse-message">{t.messageLabel}</label>
                <textarea id="refuse-message" name="message" rows={3} maxLength={1000} className="input w-full" placeholder={t.messagePlaceholder} />
              </div>
              <button type="submit" className="btn-danger btn-sm">{t.refuseSubmit}</button>
            </form>
          </Section>
        )}

        {/* Édition des champs */}
        <Section title={t.editTitle}>
          <ServiceEditForm
            service={{
              id: service.id,
              title: service.title,
              description: service.description ?? "",
              price_minor: service.price_minor,
              delivery_days: service.delivery_days,
              status: service.status,
              category_id: service.category_id ?? "",
            }}
            categories={categories.map((c) => ({
              id: c.id,
              name: locale === "en" ? c.name_en : c.name_fr,
            }))}
            locale={locale}
          />
        </Section>
      </div>
    </AdminShell>
  );
}
