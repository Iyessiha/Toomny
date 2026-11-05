import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { EmptyState } from "@/components/dashboard/shell";
import { Avatar, FilterTabs, Notice, Pill, TableCard, serviceTone } from "@/components/dashboard/pro";
import { formatMoney } from "@/lib/money";
import { moderateService } from "./actions";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { countryLabel, formatSubmittedAt } from "@/i18n/auth";
import { getAdminCounts } from "@/lib/admin-counts";
import { serviceQueue, type ServiceQueue } from "@/lib/service-queue";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).servicesPage.metaTitle };
}

export const dynamic = "force-dynamic";

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; queue?: string; error?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).servicesPage;
  const tabKeys = Object.keys(t.tabs);
  const { status: rawStatus, queue: rawQueue, error: errorParam } = await searchParams;
  const status = tabKeys.includes(rawStatus ?? "") ? (rawStatus as string) : "all";
  const queue = (["to_validate", "resubmitted", "rejected"] as const).find((q) => q === rawQueue) ?? null;
  const counts = await getAdminCounts();
  const queueCounts = {
    to_validate: counts.servicesToValidate - counts.servicesResubmitted,
    resubmitted: counts.servicesResubmitted,
    rejected: counts.servicesRejected,
  };
  const fr = locale !== "en";

  const db = createAdminClient();
  const base = db
    .from("services")
    .select(
      "id, title, price_minor, currency, delivery_days, status, created_at, review_notes, review_requested_at, provider:profiles!services_provider_id_profiles_id_fk(display_name, email), category:categories(name_fr)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  const filtered =
    queue === "to_validate"
      ? base.eq("status", "draft").or("review_notes.is.null,review_requested_at.not.is.null")
      : queue === "resubmitted"
        ? base.eq("status", "draft").not("review_requested_at", "is", null)
        : queue === "rejected"
          ? base.eq("status", "draft").not("review_notes", "is", null).is("review_requested_at", null)
          : status === "all"
            ? base
            : base.eq("status", status);
  const { data: rows } = await filtered;

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
      nav={getAdminNavGroups(locale, "/admin/services")}
    >
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {[
          { key: "resubmitted" as const, count: queueCounts.resubmitted, label: fr ? "Resoumises" : "Resubmitted", hint: fr ? "Corrigées : à revalider en priorité" : "Corrected: review first", tone: "border-rose-300 bg-rose-50 text-rose-900" },
          { key: "to_validate" as const, count: queueCounts.to_validate, label: fr ? "À valider" : "To validate", hint: fr ? "Nouvelles prestations" : "New services", tone: "border-amber-300 bg-amber-50 text-amber-900" },
          { key: "rejected" as const, count: queueCounts.rejected, label: fr ? "Rejetées" : "Rejected", hint: fr ? "En attente du prestataire" : "Waiting for the provider", tone: "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]" },
        ].map((card) => (
          <Link
            key={card.key}
            href={`/admin/services?queue=${card.key}`}
            aria-current={queue === card.key ? "true" : undefined}
            className={`rounded-2xl border p-4 transition-shadow hover:shadow-md ${card.tone} ${queue === card.key ? "ring-2 ring-[var(--color-brand-500)]" : ""}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{card.label}</p>
            <p className="mt-1 font-display text-3xl font-bold">{card.count}</p>
            <p className="text-xs opacity-70">{card.hint}</p>
          </Link>
        ))}
      </div>

      {errorParam === "kyc" && (
        <div className="mb-6">
          <Notice tone="warning">
            Publication impossible : le prestataire n&apos;a pas encore de vérification d&apos;identité validée.
          </Notice>
        </div>
      )}
      {!queue && (
        <FilterTabs
          items={tabKeys.map((key) => ({
            href: `/admin/services?status=${key}`,
            label: t.tabs[key as keyof typeof t.tabs],
            current: status === key,
          }))}
        />
      )}

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
            {list.map((s) => {
              const q: ServiceQueue = serviceQueue(s);
              const rowTone = q === "resubmitted" ? "bg-rose-50/60" : q === "new" ? "bg-amber-50/50" : "";
              return (
              <tr key={s.id} className={rowTone}>
                <td className="whitespace-normal!">
                  <span className="block font-semibold">{s.title}</span>
                  <span className="block text-xs text-[var(--subtle)]">
                    {locale === "en" ? "Submitted on " : "Soumise le "}
                    {formatSubmittedAt(s.created_at, locale)}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <Pill tone={serviceTone(s.status)}>{t.status[s.status] ?? s.status}</Pill>
                    {q && (
                      <Pill tone={q === "resubmitted" ? "danger" : q === "new" ? "warning" : "neutral"}>
                        {q === "resubmitted" ? (fr ? "Resoumise" : "Resubmitted") : q === "new" ? (fr ? "À valider" : "To validate") : fr ? "Rejetée" : "Rejected"}
                      </Pill>
                    )}
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
                      {t.review}
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
              );
            })}
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
