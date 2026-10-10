import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCategories } from "@/lib/catalog";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminTexts } from "@/i18n/admin";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { visitorLocale } from "@/i18n/server-locale";
import { ServiceEditForm } from "@/components/admin/service-edit-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).serviceEditPage.metaTitle };
}
export const dynamic = "force-dynamic";

export default async function AdminServiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).serviceEditPage;
  const nav = getAdminTexts(locale).nav;
  const { id } = await params;

  const db = createAdminClient();
  const [{ data: service }, categories] = await Promise.all([
    db
      .from("services")
      .select("id, title, description, price_minor, currency, delivery_days, status, category_id, provider:profiles!services_provider_id_profiles_id_fk(display_name, email)")
      .eq("id", id)
      .single(),
    getCategories(),
  ]);

  if (!service) {
    return (
      <AdminShell user={user} locale={locale} title="404" subtitle="" nav={[]}>
        <p>Prestation introuvable.</p>
      </AdminShell>
    );
  }

  const provider = Array.isArray(service.provider) ? service.provider[0] : service.provider;

  return (
    <AdminShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/admin", label: nav.overview },
        { href: "/admin/verifications", label: nav.kyc },
        { href: "/admin/services", label: nav.services, current: true },
        { href: "/admin/categories", label: nav.categories },
        { href: "/admin/users", label: nav.users },
        { href: "/admin/orders", label: nav.orders },
        { href: "/admin/disputes", label: getMarketplaceTexts(locale).nav.disputes },
        { href: "/dashboard", label: nav.myDashboard },
      ]}
    >
      <div className="max-w-2xl">
        <Link href="/admin/services" className="mb-6 inline-block text-sm text-[var(--subtle)] hover:text-[var(--foreground)]">
          {t.back}
        </Link>

        <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--subtle)] font-semibold mb-1">Prestataire</p>
          <p className="font-medium">{provider?.display_name ?? "—"}</p>
          <p className="text-sm text-[var(--subtle)]">{provider?.email}</p>
        </div>

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
      </div>
    </AdminShell>
  );
}
