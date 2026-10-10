import type { Metadata } from "next";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { statusTone } from "@/lib/dashboard";
import { getDashboardTexts } from "@/i18n/dashboard";
import { formatMoney } from "@/lib/money";
import { UUID_RE, availableActions } from "@/lib/orders";
import { OrderControls } from "@/components/orders/order-controls";
import { MessageSection } from "@/components/orders/message-section";
import { PayButton } from "@/components/orders/pay-button";
import { ReviewForm } from "@/components/orders/review-form";
import { getMarketplaceTexts } from "@/i18n/marketplace";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getPublicPageTexts(await visitorLocale()).titles.order };
}
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getDashboardTexts(locale).orders;
  const nav = getDashboardTexts(locale).nav;
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // RLS : seule une partie à la commande reçoit une ligne. Un autre compte obtient 404.
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, status, amount_minor, provider_net_minor, currency, requirements, due_at, client_id, provider_id, created_at, service:services(title)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, sender_id, created_at")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  const isClient = order.client_id === user.id;
  const isProvider = order.provider_id === user.id;

  // Avis : une fois par commande terminée, par le client seulement.
  const { data: existingReview } =
    isClient && order.status === "completed"
      ? await supabase.from("reviews").select("id").eq("order_id", id).maybeSingle()
      : { data: null };
  const reviewText = getMarketplaceTexts(locale).review;
  const actions = availableActions(isClient, isProvider, order.status);
  const service = Array.isArray(order.service) ? order.service[0] : order.service;
  const amount = isProvider ? order.provider_net_minor : order.amount_minor;

  return (
    <DashboardShell
      user={user}
      title={order.reference}
      subtitle={service?.title ?? t.detailSubtitleFallback}
      locale={locale}
      nav={[
        { href: "/dashboard", label: nav.overview },
        { href: "/orders", label: nav.orders, current: true },
        { href: "/messages", label: nav.messages },
      ]}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}>
                {getDashboardTexts(locale).status[order.status] ?? order.status}
              </span>
              <span className="font-display text-xl font-bold">
                {formatMoney(BigInt(amount), order.currency, locale)}
                <span className="ml-2 text-xs font-normal text-[var(--subtle)]">{isProvider ? t.netLabel : t.ttc}</span>
              </span>
            </div>
            <h2 className="mt-6 text-sm font-semibold">{t.requirements}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--subtle)]">{order.requirements ?? t.noRequirements}</p>
          </section>

          <MessageSection
            orderId={order.id}
            userId={user.id}
            initialMessages={messages ?? []}
            locale={locale}
          />
        </div>

        <aside className="space-y-4">
          {isClient && order.status === "completed" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
              <h2 className="font-display text-base font-bold">{reviewText.title}</h2>
              <div className="mt-4">
                {existingReview ? (
                  <p className="text-sm text-[var(--subtle)]">{reviewText.alreadyDone}</p>
                ) : (
                  <ReviewForm orderId={order.id} locale={locale} />
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
            <h2 className="font-display text-base font-bold">{t.actions}</h2>
            <div className="mt-4">
              {actions.length > 0 ? (
                <OrderControls orderId={order.id} actions={actions} locale={locale} />
              ) : (
                <p className="text-sm text-[var(--subtle)]">{t.noActions}</p>
              )}
            </div>
          </div>
          {isClient && order.status === "pending_payment" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p>{t.pendingPayment}</p>
              <PayButton
                orderId={order.id}
                labels={{ payNow: t.payNow, paying: t.paying, payError: t.payError }}
              />
            </div>
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}
