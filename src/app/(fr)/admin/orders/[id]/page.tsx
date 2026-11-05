import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { Avatar, Notice, Pill, Section, orderTone } from "@/components/dashboard/pro";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getAdminTexts } from "@/i18n/admin";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { visitorLocale } from "@/i18n/server-locale";
import { formatMoney } from "@/lib/money";
import { confirmPaymentReceived, forceOrderTransition, resendPaymentEmails } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).orderDetailPage.metaTitle };
}
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).orderDetailPage;
  const tOrders = getAdminTexts(locale).ordersPage;
  const { id } = await params;
  const nav = getAdminNavGroups(locale, "/admin/orders");

  const db = createAdminClient();
  const { data: order } = UUID_RE.test(id)
    ? await db
        .from("orders")
        .select(
          "id, reference, status, currency, amount_minor, collect_fee_minor, client_charge_minor, commission_minor, payout_fee_minor, provider_net_minor, requirements, due_at, created_at, delivered_at, completed_at, service:services(id, title), client:profiles!orders_client_id_profiles_id_fk(display_name, email), provider:profiles!orders_provider_id_profiles_id_fk(display_name, email)",
        )
        .eq("id", id)
        .maybeSingle()
    : { data: null };

  if (!order) {
    return (
      <AdminShell user={user} locale={locale} title={t.notFound} subtitle="" nav={nav}>
        <Notice tone="danger">{t.notFound}</Notice>
      </AdminShell>
    );
  }

  const service = Array.isArray(order.service) ? order.service[0] : order.service;
  const client = Array.isArray(order.client) ? order.client[0] : order.client;
  const provider = Array.isArray(order.provider) ? order.provider[0] : order.provider;
  const money = (v: number | string) => formatMoney(BigInt(v), order.currency, locale);
  const fmtDate = (v: string | null) =>
    v ? new Date(v).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : t.notSet;

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={order.reference}
      subtitle={getDashboardTexts(locale).status[order.status] ?? order.status}
      nav={nav}
    >
      <div className="max-w-4xl space-y-6">
        <Link href="/admin/orders" className="btn-ghost btn-sm">← {t.back}</Link>

        <Section title={t.service}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href={`/admin/services/${service?.id}`} className="font-semibold underline-offset-2 hover:underline">
              {service?.title ?? "—"}
            </Link>
            <Pill tone={orderTone(order.status)}>{getDashboardTexts(locale).status[order.status] ?? order.status}</Pill>
          </div>
        </Section>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title={t.client}>
            <div className="flex items-center gap-3">
              <Avatar name={client?.display_name ?? client?.email} />
              <div className="min-w-0">
                <p className="truncate font-medium">{client?.display_name ?? "—"}</p>
                <p className="truncate text-sm text-[var(--subtle)]">{client?.email}</p>
              </div>
            </div>
          </Section>
          <Section title={t.provider}>
            <div className="flex items-center gap-3">
              <Avatar name={provider?.display_name ?? provider?.email} />
              <div className="min-w-0">
                <p className="truncate font-medium">{provider?.display_name ?? "—"}</p>
                <p className="truncate text-sm text-[var(--subtle)]">{provider?.email}</p>
              </div>
            </div>
          </Section>
        </div>

        <Section title={t.amounts}>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{t.price}</dt><dd className="font-medium">{money(order.amount_minor)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{t.clientFee}</dt><dd>{money(order.collect_fee_minor)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{t.clientCharge}</dt><dd className="font-medium">{money(order.client_charge_minor)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{t.commission}</dt><dd>{money(order.commission_minor)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{t.payoutFee}</dt><dd>{money(order.payout_fee_minor)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{t.providerNet}</dt><dd className="font-medium">{money(order.provider_net_minor)}</dd></div>
          </dl>
        </Section>

        <Section title={t.dates}>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{t.created}</dt><dd>{fmtDate(order.created_at)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{t.due}</dt><dd>{fmtDate(order.due_at)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{t.delivered}</dt><dd>{fmtDate(order.delivered_at)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{t.completed}</dt><dd>{fmtDate(order.completed_at)}</dd></div>
          </dl>
        </Section>

        <Section title={t.requirements}>
          <p className="whitespace-pre-line text-sm">{order.requirements || t.noRequirements}</p>
        </Section>

        <Section title={t.actions}>
          <div className="flex flex-wrap gap-2">
            {order.status === "pending_payment" && (
              <form action={confirmPaymentReceived}>
                <input type="hidden" name="orderId" value={order.id} />
                <button type="submit" className="btn-primary btn-sm">{tOrders.confirm}</button>
              </form>
            )}
            {order.status === "funded" && (
              <form action={forceOrderTransition}>
                <input type="hidden" name="orderId" value={order.id} />
                <button type="submit" className="btn-warn btn-sm">{tOrders.forceStart}</button>
              </form>
            )}
            {order.status === "in_progress" && (
              <form action={forceOrderTransition}>
                <input type="hidden" name="orderId" value={order.id} />
                <button type="submit" className="btn-ghost btn-sm">{tOrders.forceDeliver}</button>
              </form>
            )}
            {order.status === "delivered" && (
              <form action={forceOrderTransition}>
                <input type="hidden" name="orderId" value={order.id} />
                <button type="submit" className="btn-success btn-sm">{tOrders.forceComplete}</button>
              </form>
            )}
            {["funded", "in_progress", "delivered", "completed"].includes(order.status) && (
              <form action={resendPaymentEmails}>
                <input type="hidden" name="orderId" value={order.id} />
                <button type="submit" className="btn-ghost btn-sm">Renvoyer les e-mails de paiement</button>
              </form>
            )}
            {order.status === "disputed" && (
              <Link href="/admin/disputes" className="btn-danger btn-sm">{t.disputes}</Link>
            )}
          </div>
        </Section>
      </div>
    </AdminShell>
  );
}
