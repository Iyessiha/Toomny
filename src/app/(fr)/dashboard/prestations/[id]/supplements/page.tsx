import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_RE } from "@/lib/orders";
import { hasPaidPlan } from "@/lib/plans";
import { MAX_ADDONS_PER_SERVICE } from "@/lib/service-addons";
import { AddonsManager } from "@/components/dashboard/addons-manager";
import { getAddonTexts } from "@/i18n/addons";
import { getDashboardTexts } from "@/i18n/dashboard";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { Notice } from "@/components/dashboard/pro";

export const metadata: Metadata = { title: "Suppléments · Toomny", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ServiceAddonsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!isProvider(user.role)) redirect("/dashboard");
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const locale = user.preferredLocale;
  const t = getAddonTexts(locale);
  const nav = getDashboardTexts(locale).nav;

  const db = createAdminClient();
  const [{ data: service }, { data: profile }, { data: addons }] = await Promise.all([
    db.from("services").select("id, title, provider_id").eq("id", id).maybeSingle(),
    db.from("provider_profiles").select("plan, plan_expires_at").eq("profile_id", user.id).maybeSingle(),
    db
      .from("service_addons")
      .select("id, title, description, price_minor, currency, extra_delivery_days, active")
      .eq("service_id", id)
      .order("created_at", { ascending: true }),
  ]);
  if (!service || service.provider_id !== user.id) notFound();

  const paid = hasPaidPlan(profile?.plan, profile?.plan_expires_at ?? null);
  const list = (addons ?? []).map((a) => ({
    id: a.id as string,
    title: a.title as string,
    description: (a.description as string | null) ?? null,
    price_minor: Number(a.price_minor),
    currency: a.currency as string,
    extra_delivery_days: Number(a.extra_delivery_days),
    active: Boolean(a.active),
  }));

  return (
    <DashboardShell
      user={user}
      title={t.managerTitle}
      subtitle={service.title}
      locale={locale}
      navSections={dashboardNavSections(nav, user.role, "/dashboard/prestations")}
    >
      <Link href="/dashboard/prestations" className="mb-6 inline-block text-sm font-semibold text-[var(--color-brand-600)] hover:underline">
        ← {t.backToServices}
      </Link>

      {!paid ? (
        <Notice tone="warning" title={t.locked}>
          <Link href="/dashboard/plan" className="font-semibold underline underline-offset-2">
            {t.upgrade}
          </Link>
        </Notice>
      ) : (
        <AddonsManager serviceId={id} addons={list} texts={t} limit={MAX_ADDONS_PER_SERVICE} />
      )}
    </DashboardShell>
  );
}
