import type { Locale } from "@/i18n/dictionaries";
import { emailLayout } from "./layout";
import { escapeHtml } from "./service-rejected";
import { renderBoostOffers, type BoostOffer } from "./service-published";

export type BoostReminderEmailOpts = {
  firstName: string;
  serviceTitle: string;
  boostUrl: string;
  offers: BoostOffer[];
  locale: Locale;
  siteUrl: string;
};

const copy = {
  fr: {
    preview: "Votre prestation peut gagner plus de visibilité dès aujourd'hui.",
    greeting: (n: string) => `Bonjour ${n},`,
    greetingAnon: "Bonjour,",
    headline: "Faites remarquer votre prestation",
    intro: (title: string) => `« ${title} » est en ligne, mais les clients qui cherchent votre métier voient d'abord les prestations boostées.`,
    body: "Un boost dure 30 jours et ne se paie qu'une fois. Choisissez l'offre qui correspond à votre objectif.",
    perTier: "/ 30 jours",
    cta: "Voir les offres de boost",
    placements: {
      catalogue_badge: "Badge « Vedette » dans le catalogue",
      catalogue_sort: "Affichage prioritaire dans les résultats",
      search_sponsored: "Résultats de recherche sponsorisés",
      homepage_featured: "Mise en avant sur la page d'accueil",
    } as Record<string, string>,
    signature: "L'équipe Toomny",
  },
  en: {
    preview: "Your service can get more visibility from today.",
    greeting: (n: string) => `Hello ${n},`,
    greetingAnon: "Hello,",
    headline: "Get your service noticed",
    intro: (title: string) => `“${title}” is live, but clients searching for your skill see boosted services first.`,
    body: "A boost lasts 30 days and is paid once. Pick the offer that fits your goal.",
    perTier: "/ 30 days",
    cta: "See boost offers",
    placements: {
      catalogue_badge: "“Featured” badge in the catalogue",
      catalogue_sort: "Priority placement in results",
      search_sponsored: "Sponsored search results",
      homepage_featured: "Featured on the home page",
    } as Record<string, string>,
    signature: "The Toomny team",
  },
} as const;

export function renderBoostReminderEmail(opts: BoostReminderEmailOpts): string {
  const t = copy[opts.locale === "en" ? "en" : "fr"];
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
        <p style="margin:0 0 14px;font-size:15px;color:#34443b;line-height:1.6;">${escapeHtml(t.intro(opts.serviceTitle))}</p>
        <p style="margin:0 0 22px;font-size:14px;color:#4f5f56;line-height:1.6;">${t.body}</p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>${renderBoostOffers(opts.offers, t.perTier, t.placements)}</tr></table>
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
          <tr>
            <td style="border-radius:12px;background:linear-gradient(135deg,#108043,#2fa36a);">
              <a href="${escapeHtml(opts.boostUrl)}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${t.cta} →</a>
            </td>
          </tr>
        </table>
        <p style="margin:26px 0 0;font-size:14px;color:#1d2b23;">${t.signature}</p>
      </td>
    </tr>`;
  return emailLayout({
    siteUrl: opts.siteUrl,
    previewText: t.preview,
    children: `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${content}</table>`,
  });
}
