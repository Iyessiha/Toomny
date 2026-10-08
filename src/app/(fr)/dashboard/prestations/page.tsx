import type { Metadata } from "next";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import { redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/catalog";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { formatMoney } from "@/lib/money";
import { ServiceForm } from "@/components/dashboard/service-form";
import { getDashboardTexts } from "@/i18n/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getPublicPageTexts(await visitorLocale()).titles.services };
}
export const dynamic = "force-dynamic";

export default async function PrestationsPage() {
  const user = await requireAuth();
  if (!isProvider(user.role)) redirect("/dashboard");
  const locale = user.preferredLocale;
  const t = getDashboardTexts(locale).services;
  const nav = getDashboardTexts(locale).nav;

  const supabase = await createClient();
  const [{ data: services }, categories] = await Promise.all([
    supabase
      .from("services")
      .select("id, title, price_minor, currency, delivery_days, status, created_at")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false }),
    getCategories(),
  ]);

  const list = services ?? [];

  return (
    <DashboardShell
      user={user}
      title={t.title}
      subtitle={t.subtitle}
      locale={locale}
      nav={[
        { href: "/dashboard", label: nav.overview },
        { href: "/dashboard/prestations", label: nav.services, current: true },
        { href: "/dashboard/profil", label: nav.profile },
        { href: "/orders", label: nav.orders },
        { href: "/messages", label: nav.messages },
      ]}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="font-display text-lg font-bold">{t.listTitle}</h2>
          {list.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title={t.emptyTitle}
                body={t.emptyBody}
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
              {list.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--subtle)]">
                      {t.delivery} {s.delivery_days} {t.days} · {getDashboardTexts(locale).service[s.status] ?? s.status}
                    </p>
                  </div>
                  <p className="shrink-0 font-display font-bold">
                    {formatMoney(BigInt(s.price_minor), s.currency, locale)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg font-bold">{t.newTitle}</h2>
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
            <ServiceForm locale={locale} categories={categories.map((c) => ({ id: c.id, name: locale === "en" ? c.name_en : c.name_fr }))} />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
