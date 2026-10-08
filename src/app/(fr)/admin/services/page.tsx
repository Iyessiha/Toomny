import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { formatMoney } from "@/lib/money";
import { moderateService } from "./actions";
import { getAdminTexts } from "@/i18n/admin";

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
    <DashboardShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/admin", label: nav.overview },
        { href: "/admin/verifications", label: nav.kyc },
        { href: "/admin/services", label: nav.services, current: true },
        { href: "/admin/orders", label: nav.orders },
        { href: "/dashboard", label: nav.myDashboard },
      ]}
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {tabKeys.map((key) => (
          <a
            key={key}
            href={`/admin/services?status=${key}`}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              status === key
                ? "bg-[var(--color-brand-500)] text-white"
                : "border border-[var(--border)] bg-[var(--background)] text-[var(--subtle)]"
            }`}
          >
            {t.tabs[key as keyof typeof t.tabs]}
          </a>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
              <tr>
                <th className="px-5 py-3 font-medium">{t.colService}</th>
                <th className="px-5 py-3 font-medium">{t.colProvider}</th>
                <th className="px-5 py-3 text-right font-medium">{t.colPrice}</th>
                <th className="px-5 py-3 text-right font-medium">{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s, i) => (
                <tr key={s.id} className={i < list.length - 1 ? "border-b border-[var(--border)]" : ""}>
                  <td className="px-5 py-4">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-[var(--subtle)]">
                      {s.category?.name_fr ?? "—"} · {s.delivery_days} {t.days} · {t.status[s.status] ?? s.status}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-[var(--subtle)]">
                    {s.provider?.display_name ?? "—"}
                    <p className="text-xs">{s.provider?.email}</p>
                  </td>
                  <td className="px-5 py-4 text-right font-display font-bold">
                    {formatMoney(BigInt(s.price_minor), s.currency, locale)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
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
          </table>
        </div>
      )}
    </DashboardShell>
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
        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
          primary
            ? "bg-[var(--color-brand-500)] text-white"
            : "border border-[var(--border)] text-[var(--subtle)] hover:text-[var(--foreground)]"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
