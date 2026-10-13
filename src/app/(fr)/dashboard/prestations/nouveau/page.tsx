import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
import { getCategories } from "@/lib/catalog";
import { DashboardShell } from "@/components/dashboard/shell";
import { ServiceForm } from "@/components/dashboard/service-form";
import { getDashboardTexts } from "@/i18n/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Nouvelle prestation — Toomny" };
}
export const dynamic = "force-dynamic";

export default async function NouvellePrestation() {
  const user = await requireAuth();
  if (!isProvider(user.role)) redirect("/dashboard");
  const locale = user.preferredLocale;
  const t = getDashboardTexts(locale);
  const nav = t.nav;
  const categories = await getCategories();

  return (
    <DashboardShell
      user={user}
      title={t.services.newTitle}
      locale={locale}
      nav={[
        { href: "/dashboard", label: nav.overview },
        { href: "/dashboard/prestations", label: nav.services },
        { href: "/dashboard/profil", label: nav.profile },
        { href: "/orders", label: nav.orders },
        { href: "/messages", label: nav.messages },
      ]}
    >
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard/prestations"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--subtle)] transition-colors hover:text-[var(--foreground)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {locale === "en" ? "Back to services" : "Retour aux prestations"}
        </Link>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 sm:p-8">
          <h2 className="font-display text-xl font-bold mb-6">{t.services.newTitle}</h2>
          <ServiceForm
            locale={locale}
            categories={categories.map((c) => ({ id: c.id, name: locale === "en" ? c.name_en : c.name_fr }))}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
