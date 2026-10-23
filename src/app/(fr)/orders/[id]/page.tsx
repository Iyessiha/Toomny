import type { Metadata } from "next";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { Notice, Pill, Section, orderTone } from "@/components/dashboard/pro";
import { getDashboardTexts } from "@/i18n/dashboard";
import { formatMoney } from "@/lib/money";
import { UUID_RE, availableActions } from "@/lib/orders";
import { OrderControls } from "@/components/orders/order-controls";
import { MessageSection } from "@/components/orders/message-section";
import { PayButton } from "@/components/orders/pay-button";
import { CheckPaymentButton } from "@/components/orders/check-payment-button";
import { checkOrderPayment } from "../actions";
import { ReviewForm } from "@/components/orders/review-form";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { NotificationBell } from "@/components/dashboard/notification-bell";

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
    .select("id, reference, status, amount_minor, client_charge_minor, provider_net_minor, currency, requirements, due_at, client_id, provider_id, created_at, service:services(title)")
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
      bell={<NotificationBell locale={locale} />}
      title={order.reference}
      subtitle={service?.title ?? t.detailSubtitleFallback}
      locale={locale}
      navSections={dashboardNavSections(nav, user.role, "/orders")}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {isClient && order.status === "pending_payment" && (
            <div className="rounded-2xl border-2 border-[var(--color-brand-500)] bg-[var(--color-brand-50)] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold">{t.payBannerTitle}</p>
                  <p className="mt-1 text-sm text-[var(--subtle)]">{t.payBannerBody}</p>
                  <p className="mt-2 font-display text-lg font-bold">
                    {t.payBannerAmount} : {formatMoney(BigInt(order.client_charge_minor ?? order.amount_minor), order.currency, locale)}
                  </p>
                </div>
                <div className="w-full shrink-0 sm:w-56">
                  <PayButton
                    orderId={order.id}
                    labels={{ payNow: t.payNow, paying: t.paying, payError: t.payError }}
                  />
                  <CheckPaymentButton
                    orderId={order.id}
                    action={checkOrderPayment}
                    labels={{
                      checkPayment: t.checkPayment,
                      checkingPayment: t.checkingPayment,
                      checkPending: t.checkPending,
                      checkFailed: t.checkFailed,
                      checkError: t.checkError,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          <Section
            title={t.requirements}
            action={
              <span className="flex items-center gap-3">
                <span className="font-display text-lg font-bold">
                  {formatMoney(BigInt(amount), order.currency, locale)}
                  <span className="ml-2 text-xs font-normal text-[var(--subtle)]">
                    {isProvider ? t.netLabel : t.ttc}
                  </span>
                </span>
                <Pill tone={orderTone(order.status)}>
                  {getDashboardTexts(locale).status[order.status] ?? order.status}
                </Pill>
              </span>
            }
          >
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--subtle)]">
              {order.requirements ?? t.noRequirements}
            </p>
          </Section>

          <MessageSection
            orderId={order.id}
            userId={user.id}
            initialMessages={messages ?? []}
            locale={locale}
          />
        </div>

        <aside className="space-y-4">
          {isClient && order.status === "completed" && (
            <Section title={reviewText.title}>
              {existingReview ? (
                <p className="text-sm text-[var(--subtle)]">{reviewText.alreadyDone}</p>
              ) : (
                <ReviewForm orderId={order.id} locale={locale} />
              )}
            </Section>
          )}

          <Section title={t.actions}>
            {actions.length > 0 ? (
              <OrderControls orderId={order.id} actions={actions} locale={locale} />
            ) : (
              <p className="text-sm text-[var(--subtle)]">{t.noActions}</p>
            )}
          </Section>
        </aside>
      </div>
    </DashboardShell>
  );
}
