import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/dashboard/shell";
import { Avatar, FilterTabs, Pill, TableCard, serviceTone } from "@/components/dashboard/pro";
import { formatMoney } from "@/lib/money";
import { moderateService } from "./actions";
import { getAdminTexts } from "@/i18n/admin";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { visitorLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).servicesPage.metaTitle };
}

export const dynamic = "force-dynamic";

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).servicesPage;
  const nav = getAdminTexts(locale).nav;
  const tabKeys = Object.keys(t.tabs);
  const { status: rawStatus } = await searchParams;
  const status = tabKeys.includes(rawStatus ?? "") ? (rawStatus as string) : "draft";

  const db = createAdminClient();
  const { data: rows } = await db
    .from("services")
    .select(
      "id, title, price_minor, currency, delivery_days, status, created_at, provider:profiles!services_provider_id_profiles_id_fk(display_name, email), category:categories(name_fr)",
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = (rows ?? []).map((r) => {
    const provider = Array.isArray(r.provider) ? r.provider[0] : r.provider;
    const category = Array.isArray(r.category) ? r.category[0] : r.category;
    return { ...r, provider, category };
  });

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/admin", label: nav.overview },
        { href: "/admin/verifications", label: nav.kyc },
        { href: "/admin/services", label: nav.services, current: true },
        { href: "/admin/categories", label: nav.categories },
        { href: "/admin/users", label: nav.users },
        { href: "/admin/orders", label: nav.orders },
        { href: "/admin/payouts", label: nav.payouts },
        { href: "/admin/disputes", label: getMarketplaceTexts(locale).nav.disputes },
        { href: "/dashboard", label: nav.myDashboard },
      ]}
    >
      <FilterTabs
        items={tabKeys.map((key) => ({
          href: `/admin/services?status=${key}`,
          label: t.tabs[key as keyof typeof t.tabs],
          current: status === key,
        }))}
      />

      {list.length === 0 ? (
        <EmptyState title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <TableCard>
          <thead>
            <tr>
              <th>{t.colService}</th>
              <th>{t.colProvider}</th>
              <th className="text-right">{t.colPrice}</th>
              <th className="text-right">{t.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td className="whitespace-normal!">
                  <span className="block font-semibold">{s.title}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <Pill tone={serviceTone(s.status)}>{t.status[s.status] ?? s.status}</Pill>
                    <span className="text-xs text-[var(--subtle)]">
                      {s.category?.name_fr ?? "—"} · {s.delivery_days} {t.days}
                    </span>
                  </span>
                </td>
                <td className="whitespace-normal!">
                  <span className="flex items-center gap-2">
                    <Avatar name={s.provider?.display_name ?? s.provider?.email} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{s.provider?.display_name ?? "—"}</span>
                      <span className="block truncate text-xs text-[var(--subtle)]">
                        {s.provider?.email}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="text-right font-display font-bold">
                  {formatMoney(BigInt(s.price_minor), s.currency, locale)}
                </td>
                <td>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link href={`/admin/services/${s.id}`} className="btn-ghost btn-sm">
                      {t.edit}
                    </Link>
                    {s.status !== "active" && (
                      <ModerationButton serviceId={s.id} status="active" label={t.publish} primary />
                    )}
                    {s.status === "active" && (
                      <ModerationButton serviceId={s.id} status="paused" label={t.pause} />
                    )}
                    {s.status !== "removed" && (
                      <ModerationButton serviceId={s.id} status="removed" label={t.remove} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </AdminShell>
  );
}

function ModerationButton({
  serviceId,
  status,
  label,
  primary = false,
}: {
  serviceId: string;
  status: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={moderateService}>
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`${primary ? "btn-primary" : status === "removed" ? "btn-danger" : "btn-ghost"} btn-sm`}
      >
        {label}
      </button>
    </form>
  );
}
