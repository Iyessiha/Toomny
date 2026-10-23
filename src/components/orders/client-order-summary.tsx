import Link from "next/link";
import type { Locale } from "@/i18n/dictionaries";
import { getReceiptTexts } from "@/i18n/receipt";
import { formatMoney } from "@/lib/money";
import { formatReceiptDate } from "@/lib/receipt-format";
import { ORDER_STEPS, orderProgress, stepState, type StepState } from "@/lib/order-progress";
import { Pill, orderTone } from "@/components/dashboard/pro";

export type ClientOrderSummaryProps = {
  locale: Locale;
  orderId: string;
  reference: string;
  status: string;
  serviceTitle: string;
  providerName: string;
  createdAt: Date;
  dueAt: Date | null;
  currency: string;
  priceMinor: bigint;
  feeMinor: bigint;
  totalMinor: bigint;
};

const STATE_CLASS: Record<StepState, string> = {
  done: "border-[var(--color-brand-500)] bg-[var(--color-brand-500)] text-white",
  next: "border-[var(--color-brand-500)] bg-white text-[var(--color-brand-600)] animate-pulse",
  upcoming: "border-[var(--border)] bg-white text-[var(--subtle)]",
};

/** Récapitulatif d'une commande côté client : badge, suivi par étapes, détail et paiement. */
export function ClientOrderSummary(props: ClientOrderSummaryProps) {
  const t = getReceiptTexts(props.locale);
  const progress = orderProgress(props.status);
  const money = (value: bigint) => formatMoney(value, props.currency, props.locale);
  const isPaid = progress.terminal ? false : progress.reached >= 1;

  const details: [string, string][] = [
    [t.orderedOn, formatReceiptDate(props.createdAt, props.locale)],
    [t.service, props.serviceTitle],
    [t.provider, props.providerName],
    ...(props.dueAt ? ([[t.deliveryBy, formatReceiptDate(props.dueAt, props.locale)]] as [string, string][]) : []),
  ];

  return (
    <section className="animate-rise space-y-6 rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">{t.summaryHeading}</h2>
          <p className="mt-0.5 text-sm text-[var(--subtle)]">{props.reference}</p>
        </div>
        <Pill tone={orderTone(props.status)}>{t.badge[props.status as keyof typeof t.badge] ?? props.status}</Pill>
      </header>

      <p className="rounded-2xl bg-[var(--color-brand-50)] px-5 py-4 text-sm font-medium text-[var(--color-brand-700,#0b5d30)]">
        {t.headline[props.status as keyof typeof t.headline] ?? ""}
      </p>

      {!progress.terminal && (
        <ol className="grid gap-3 sm:grid-cols-5">
          {ORDER_STEPS.map((step, index) => {
            const state = stepState(index, progress);
            return (
              <li key={step} className="flex items-center gap-3 sm:flex-col sm:text-center">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${STATE_CLASS[state]}`}
                  aria-hidden="true"
                >
                  {state === "done" ? "✓" : index + 1}
                </span>
                <span className={`text-sm ${state === "upcoming" ? "text-[var(--subtle)]" : "font-semibold"}`}>
                  {t.steps[step]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--subtle)]">{t.detailsHeading}</h3>
          <dl className="mt-3 divide-y divide-[var(--border)]">
            {details
              .filter(([, value]) => value !== "")
              .map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-[var(--subtle)]">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
          </dl>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--subtle)]">{t.paymentHeading}</h3>
          <dl className="mt-3 divide-y divide-[var(--border)]">
            <div className="flex justify-between gap-4 py-2.5 text-sm">
              <dt className="text-[var(--subtle)]">{t.price}</dt>
              <dd className="font-medium">{money(props.priceMinor)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5 text-sm">
              <dt className="text-[var(--subtle)]">{t.fee}</dt>
              <dd className="font-medium">{money(props.feeMinor)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="font-display font-bold">{t.total}</dt>
              <dd className="font-display text-lg font-bold text-[var(--color-brand-600)]">{money(props.totalMinor)}</dd>
            </div>
          </dl>
          {isPaid && (
            <Link
              href={`/orders/${props.orderId}/recu`}
              className="mt-4 inline-block text-sm font-semibold text-[var(--color-brand-600)] underline-offset-2 hover:underline"
            >
              {t.viewReceipt} →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
