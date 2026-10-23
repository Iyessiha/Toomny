import type { Locale } from "@/i18n/dictionaries";
import { getReceiptTexts } from "@/i18n/receipt";
import { formatMoney } from "@/lib/money";
import { escapeHtml, formatReceiptDate } from "@/lib/receipt-format";
import type { Receipt } from "@/lib/receipt";
import { emailLayout } from "./layout";

export type PaymentReceiptEmailOpts = {
  audience: "client" | "provider";
  firstName: string;
  receipt: Receipt;
  orderUrl: string;
  receiptUrl: string;
  locale: Locale;
  siteUrl: string;
};

const BRAND = "#108043";
const BRAND_DARK = "#0b5d30";
const INK = "#1d2b23";
const MUTED = "#6b7b72";
const LINE = "#e6ece8";
const BRIEF_MAX = 600;

function row(label: string, value: string, strong = false): string {
  const weight = strong ? "700" : "500";
  return `<tr>
    <td style="padding:11px 0;font-size:13px;color:${MUTED};border-bottom:1px solid ${LINE};">${label}</td>
    <td style="padding:11px 0;font-size:14px;font-weight:${weight};color:${INK};text-align:right;border-bottom:1px solid ${LINE};">${value}</td>
  </tr>`;
}

function button(href: string, label: string, primary: boolean): string {
  const background = primary ? BRAND : "#ffffff";
  const color = primary ? "#ffffff" : BRAND;
  return `<a href="${href}" style="display:inline-block;margin:0 8px 10px 0;padding:14px 28px;font-size:14px;font-weight:700;letter-spacing:0.01em;color:${color};background:${background};border:1.5px solid ${BRAND};border-radius:999px;text-decoration:none;">${label}</a>`;
}

/** Une étape du parcours : cercle plein si franchie, contour sinon. */
function step(label: string, done: boolean, current: boolean): string {
  const bg = done ? BRAND : "#ffffff";
  const fg = done ? "#ffffff" : current ? BRAND : MUTED;
  const border = done || current ? BRAND : LINE;
  const mark = done ? "&#10003;" : "&#9675;";
  return `<td align="center" style="padding:0 4px;">
    <div style="width:30px;height:30px;line-height:30px;margin:0 auto 6px;border-radius:50%;background:${bg};border:2px solid ${border};color:${fg};font-size:13px;font-weight:700;">${mark}</div>
    <div style="font-size:11px;font-weight:${done || current ? "700" : "500"};color:${done || current ? INK : MUTED};">${label}</div>
  </td>`;
}

/**
 * E-mail « paiement confirmé » : reçu détaillé pour le client, commande payée avec
 * brief et bouton « Accepter et démarrer » pour le prestataire.
 */
export function renderPaymentReceiptEmail(opts: PaymentReceiptEmailOpts): string {
  const t = getReceiptTexts(opts.locale);
  const r = opts.receipt;
  const isClient = opts.audience === "client";
  const money = (value: bigint) => formatMoney(value, r.currency, opts.locale);
  const greeting = t.greeting(escapeHtml(opts.firstName));
  const title = isClient ? t.title : t.newOrderTitle;
  const intro = isClient ? t.intro : t.newOrderBody;
  const eyebrow = isClient ? t.receiptTitle : t.steps.paid;

  const hero = `
    <tr>
      <td style="padding:34px 36px 30px;background:linear-gradient(135deg,${BRAND_DARK} 0%,${BRAND} 100%);">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#bfe7d0;">&#10003; ${eyebrow}</p>
        <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;line-height:1.25;color:#ffffff;">${title}</h1>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#e3f4ea;">${intro}</p>
        <p style="margin:18px 0 0;"><span style="display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,0.16);font-size:12px;font-weight:700;color:#ffffff;letter-spacing:0.04em;">${escapeHtml(r.reference)}</span></p>
      </td>
    </tr>`;

  const steps = isClient
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 26px;">
        <tr>
          ${step(t.steps.created, true, false)}
          ${step(t.steps.paid, true, false)}
          ${step(t.steps.started, false, true)}
          ${step(t.steps.delivered, false, false)}
        </tr>
      </table>`
    : "";

  const details = [
    row(t.service, escapeHtml(r.serviceTitle)),
    row(isClient ? t.provider : t.payer, escapeHtml(isClient ? r.providerName : r.clientName)),
    ...(r.dueAt ? [row(isClient ? t.deliveryBy : t.deliverBy, formatReceiptDate(r.dueAt, opts.locale))] : []),
  ].join("");

  const receiptBlock = `
    <div style="margin:0 0 26px;border:1px solid ${LINE};border-radius:16px;overflow:hidden;">
      <div style="padding:16px 20px;background:#f4f9f6;border-bottom:1px dashed #b9d9c6;">
        <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND};">${t.receiptTitle}</p>
        <p style="margin:4px 0 0;font-size:12px;color:${MUTED};">${t.issuer}</p>
      </div>
      <div style="padding:6px 20px 18px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${row(t.price, money(r.priceMinor))}
          ${row(t.fee, money(r.feeMinor))}
          <tr>
            <td style="padding:16px 0 4px;font-size:15px;font-weight:800;color:${INK};">${t.total}</td>
            <td style="padding:16px 0 4px;font-size:20px;font-weight:800;color:${BRAND};text-align:right;">${money(r.totalMinor)}</td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:14px;">
          ${row(t.paidOn, formatReceiptDate(r.paidAt, opts.locale))}
          ${row(t.method, t.methodValue)}
          ${r.paymentRef ? row(t.paymentRef, escapeHtml(r.paymentRef)) : ""}
          ${row(t.status, t.statusValue, true)}
        </table>
      </div>
    </div>`;

  const earningsBlock = `
    <div style="margin:0 0 26px;padding:18px 20px;border-radius:16px;background:#f4f9f6;">
      <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};">${t.youReceive}</p>
      <p style="margin:6px 0 0;font-size:26px;font-weight:800;color:${BRAND};">${money(r.providerNetMinor)}</p>
    </div>`;

  const briefBlock = r.requirements
    ? `<div style="margin:0 0 26px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};">${t.brief}</p>
        <div style="padding:16px 18px;border-left:4px solid ${BRAND};background:#fbfcfb;border-radius:0 12px 12px 0;font-size:14px;line-height:1.65;color:${INK};white-space:pre-line;">${escapeHtml(r.requirements.slice(0, BRIEF_MAX))}</div>
      </div>`
    : "";

  const escrowBlock = `
    <div style="margin:0 0 30px;padding:16px 18px;border-radius:12px;background:#fbf8ec;border-left:4px solid #d9a441;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${INK};">${t.escrowTitle}</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#4f5f56;">${isClient ? t.escrowBody : t.providerEscrow}</p>
    </div>`;

  const ctas = isClient
    ? `${button(opts.orderUrl, t.viewOrder, true)}${button(opts.receiptUrl, t.viewReceipt, false)}`
    : button(opts.orderUrl, t.startOrder, true);

  const body = `
    <tr>
      <td style="padding:32px 36px 36px;">
        <p style="margin:0 0 24px;font-size:15px;color:${INK};">${greeting}</p>
        ${steps}
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};">${t.summaryTitle}</p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 26px;">${details}</table>
        ${isClient ? receiptBlock : earningsBlock}
        ${briefBlock}
        ${escrowBlock}
        <div>${ctas}</div>
      </td>
    </tr>`;

  return emailLayout({
    siteUrl: opts.siteUrl,
    previewText: t.preheader,
    children: `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${hero}${body}</table>`,
  });
}
