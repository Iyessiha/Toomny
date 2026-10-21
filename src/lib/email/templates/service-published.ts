import type { Locale } from "@/i18n/dictionaries";
import { emailLayout } from "./layout";
import { escapeHtml } from "./service-rejected";
import { guideTips, renderTipsHtml } from "./guides";

export type BoostOffer = { name: string; price: string; placements: string[] };

export type ServicePublishedEmailOpts = {
  firstName: string;
  serviceTitle: string;
  serviceUrl: string;
  boostUrl: string;
  offers: BoostOffer[];
  locale: Locale;
  siteUrl: string;
};

const copy = {
  fr: {
    preview: "Votre prestation est en ligne. Voici comment la faire remarquer.",
    greeting: (n: string) => `Bonjour ${n},`,
    greetingAnon: "Bonjour,",
    headline: "Votre prestation est en ligne",
    intro: (title: string) => `« ${title} » est maintenant visible dans le catalogue Toomny. Les clients peuvent la découvrir et vous écrire.`,
    boostTitle: "Passez devant vos concurrents",
    boostIntro: "Un boost met votre prestation en avant pendant 30 jours : plus de vues, plus de demandes.",
    perTier: "/ 30 jours",
    boostCta: "Booster ma prestation",
    viewCta: "Voir ma prestation",
    viewUrlLabel: "Votre page",
    placements: {
      catalogue_badge: "Badge « Vedette » dans le catalogue",
      catalogue_sort: "Affichage prioritaire dans les résultats",
      search_sponsored: "Résultats de recherche sponsorisés",
      homepage_featured: "Mise en avant sur la page d'accueil",
    } as Record<string, string>,
    signature: "L'équipe Toomny",
  },
  en: {
    preview: "Your service is live. Here is how to get it noticed.",
    greeting: (n: string) => `Hello ${n},`,
    greetingAnon: "Hello,",
    headline: "Your service is live",
    intro: (title: string) => `“${title}” is now visible in the Toomny catalogue. Clients can find it and contact you.`,
    boostTitle: "Get ahead of the competition",
    boostIntro: "A boost puts your service in front of clients for 30 days: more views, more requests.",
    perTier: "/ 30 days",
    boostCta: "Boost my service",
    viewCta: "View my service",
    viewUrlLabel: "Your page",
    placements: {
      catalogue_badge: "“Featured” badge in the catalogue",
      catalogue_sort: "Priority placement in results",
      search_sponsored: "Sponsored search results",
      homepage_featured: "Featured on the home page",
    } as Record<string, string>,
    signature: "The Toomny team",
  },
} as const;

/** Trois offres de boost côte à côte, avec leurs prix réels. */
export function renderBoostOffers(
  offers: BoostOffer[],
  perTier: string,
  placements: Record<string, string>,
): string {
  return offers
    .map(
      (o) => `
        <td style="width:33%;vertical-align:top;padding:14px;border:1px solid #dfe7e2;border-radius:14px;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#108043;">${escapeHtml(o.name)}</p>
          <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#1d2b23;">${escapeHtml(o.price)} <span style="font-size:12px;font-weight:400;color:#6b7b72;">${perTier}</span></p>
          ${o.placements
            .map((p) => `<p style="margin:0 0 4px;font-size:12px;color:#4f5f56;">✓ ${escapeHtml(placements[p] ?? p)}</p>`)
            .join("")}
        </td>`,
    )
    .join('<td style="width:8px;"></td>');
}

export function renderServicePublishedEmail(opts: ServicePublishedEmailOpts): string {
  const t = copy[opts.locale === "en" ? "en" : "fr"];
  const tips = guideTips(opts.locale);
  const title = escapeHtml(opts.serviceTitle);

  const offersHtml = renderBoostOffers(opts.offers, t.perTier, t.placements);

  const content = `
    <tr>
      <td style="background:linear-gradient(135deg,#108043 0%,#0a552d 100%);padding:36px 36px 30px;border-radius:20px 20px 0 0;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#cdeeda;">Toomny</p>
        <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">${t.headline}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 36px;">
        <p style="margin:0 0 6px;font-size:14px;color:#4f5f56;">${escapeHtml(opts.firstName ? t.greeting(opts.firstName) : t.greetingAnon)}</p>
        <p style="margin:0 0 22px;font-size:15px;color:#34443b;line-height:1.6;">${escapeHtml(t.intro(opts.serviceTitle))}</p>

        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="border-radius:12px;background:#108043;">
              <a href="${escapeHtml(opts.serviceUrl)}" style="display:inline-block;padding:13px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${t.viewCta}</a>
            </td>
          </tr>
        </table>

        <div style="margin:30px 0 0;padding:22px;border-radius:16px;background:#f3f6f4;">
          <h2 style="margin:0 0 6px;font-size:17px;color:#1d2b23;">${t.boostTitle}</h2>
          <p style="margin:0 0 16px;font-size:14px;color:#4f5f56;line-height:1.6;">${t.boostIntro}</p>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>${offersHtml}</tr></table>
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:18px;">
            <tr>
              <td style="border-radius:12px;background:linear-gradient(135deg,#108043,#2fa36a);">
                <a href="${escapeHtml(opts.boostUrl)}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${t.boostCta} →</a>
              </td>
            </tr>
          </table>
        </div>

        ${renderTipsHtml([tips.coverPhoto])}
      </td>
    </tr>`;

  return emailLayout({
    siteUrl: opts.siteUrl,
    previewText: t.preview,
    children: `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${content}</table>`,
  });
}
