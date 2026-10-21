import type { Locale } from "@/i18n/dictionaries";
import { emailLayout } from "./layout";
import { escapeHtml } from "./service-rejected";
import { guideTips, renderTipsHtml } from "./guides";

export type KycRejectedEmailOpts = {
  firstName: string;
  reason: string;
  ctaUrl: string;
  locale: Locale;
  siteUrl: string;
};

const copy = {
  fr: {
    greeting: (name: string) => `Bonjour ${name},`,
    headline: "Vérification d'identité",
    greetingAnon: "Bonjour,",
    intro: "Nous n'avons pas pu valider votre vérification d'identité. Tant qu'elle n'est pas validée, vos prestations restent en brouillon et ne peuvent pas être publiées.",
    reasonTitle: "Motif",
    cta: "Refaire ma vérification",
    signature: "L'équipe Toomny",
  },
  en: {
    greeting: (name: string) => `Hello ${name},`,
    headline: "Identity check",
    greetingAnon: "Hello,",
    intro: "We could not validate your identity check. Until it is approved, your services stay in draft and cannot be published.",
    reasonTitle: "Reason",
    cta: "Redo my identity check",
    signature: "The Toomny team",
  },
};

export function renderKycRejectedEmail(opts: KycRejectedEmailOpts): string {
  const t = copy[opts.locale === "en" ? "en" : "fr"];
  const reason = escapeHtml(opts.reason.trim());

  const content = `
    <tr>
      <td style="height:4px;background:linear-gradient(90deg,#108043,#2fa36a);border-radius:20px 20px 0 0;"></td>
    </tr>
    <tr>
      <td style="padding:36px 36px 32px;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7b72;">${escapeHtml(opts.firstName ? t.greeting(opts.firstName) : t.greetingAnon)}</p>
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1d2b23;line-height:1.3;">${escapeHtml(t.headline)}</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#4f5f56;line-height:1.6;">${escapeHtml(t.intro)}</p>
        ${reason ? `<h2 style="margin:24px 0 8px;font-size:16px;color:#1d2b23;">${escapeHtml(t.reasonTitle)}</h2>
        <p style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #108043;font-size:14px;color:#34443b;line-height:1.6;white-space:pre-line;">${reason}</p>` : ""}
        ${renderTipsHtml([guideTips(opts.locale).idPhoto])}
        <div style="height:20px;"></div>
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="border-radius:12px;background:#108043;">
              <a href="${escapeHtml(opts.ctaUrl)}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(t.cta)}</a>
            </td>
          </tr>
        </table>
        <p style="margin:28px 0 0;font-size:14px;color:#1d2b23;">${escapeHtml(t.signature)}</p>
      </td>
    </tr>`;

  return emailLayout({
    siteUrl: opts.siteUrl,
    previewText: t.intro,
    children: `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${content}</table>`,
  });
}
