import "server-only";
import { Resend } from "resend";
import type { Locale } from "@/i18n/dictionaries";
import type { NotificationType } from "@/lib/notifications";
import type { NotificationParams } from "@/i18n/notifications";
import { getNotificationTexts } from "@/i18n/notifications";
import { getListingGuideTexts } from "@/i18n/listing-guide";
import { renderWelcomeEmail } from "./templates/welcome";
import { renderNotificationEmail } from "./templates/notification";
import { renderServiceRejectedEmail } from "./templates/service-rejected";
import { renderConfirmEmail } from "./templates/confirm";
import { renderKycRejectedEmail } from "./templates/kyc-rejected";
import { renderServicePublishedEmail, type BoostOffer } from "./templates/service-published";
import { renderBoostReminderEmail } from "./templates/boost-reminder";
import { BOOSTS, BOOST_TIERS } from "@/lib/boost";
import { formatMoney } from "@/lib/money";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = "Toomny <noreply@toomny.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com";

export async function sendWelcomeEmail(opts: {
  to: string;
  firstName: string;
  locale: Locale;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    const subject = opts.locale === "en" ? "Welcome to Toomny 🎉" : "Bienvenue sur Toomny 🎉";
    const html = renderWelcomeEmail({ ...opts, siteUrl: SITE_URL });
    await resend.emails.send({ from: FROM, to: opts.to, subject, html });
  } catch (err) {
    console.error("[email:welcome]", (err as Error).message);
  }
}

export async function sendNotificationEmail(opts: {
  to: string;
  firstName: string;
  type: NotificationType;
  params: NotificationParams;
  link: string;
  locale: Locale;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    const copy = getNotificationTexts(opts.locale).items[opts.type];
    if (!copy) return;
    const title = copy.title;
    const body = copy.body(opts.params);
    const html = renderNotificationEmail({
      firstName: opts.firstName,
      title,
      body,
      ctaUrl: `${SITE_URL}${opts.link}`,
      locale: opts.locale,
      siteUrl: SITE_URL,
    });
    await resend.emails.send({ from: FROM, to: opts.to, subject: title, html });
  } catch (err) {
    console.error("[email:notification]", opts.type, (err as Error).message);
  }
}

export async function sendServiceRejectedEmail(opts: {
  to: string;
  firstName: string;
  serviceTitle: string;
  reasons: string[];
  message: string;
  locale: Locale;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    const t = getListingGuideTexts(opts.locale).email;
    const html = renderServiceRejectedEmail({
      firstName: opts.firstName,
      serviceTitle: opts.serviceTitle,
      reasons: opts.reasons,
      message: opts.message,
      ctaUrl: `${SITE_URL}/dashboard/prestations`,
      locale: opts.locale,
      siteUrl: SITE_URL,
    });
    await resend.emails.send({ from: FROM, to: opts.to, subject: t.subject(opts.serviceTitle), html });
  } catch (err) {
    console.error("[email:service-rejected]", (err as Error).message);
  }
}

/** Confirmation d'adresse, envoyée par Resend avec le modèle Toomny (et non celui de Supabase). */
export async function sendConfirmEmail(opts: { to: string; confirmUrl: string; locale: Locale }): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  try {
    const subject = opts.locale === "en" ? "Confirm your Toomny email" : "Confirmez votre adresse Toomny";
    const html = renderConfirmEmail({ confirmUrl: opts.confirmUrl, siteUrl: SITE_URL });
    await resend.emails.send({ from: FROM, to: opts.to, subject, html });
    return true;
  } catch (err) {
    console.error("[email:confirm]", (err as Error).message);
    return false;
  }
}

/** Demande de vérification d'identité refusée, avec le motif. */
export async function sendKycRejectedEmail(opts: {
  to: string;
  firstName: string;
  reason: string;
  locale: Locale;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    const html = renderKycRejectedEmail({
      firstName: opts.firstName,
      reason: opts.reason,
      ctaUrl: `${SITE_URL}/dashboard/verification`,
      locale: opts.locale,
      siteUrl: SITE_URL,
    });
    const subject = opts.locale === "en" ? "Your identity check was not approved" : "Votre vérification d'identité n'a pas été validée";
    await resend.emails.send({ from: FROM, to: opts.to, subject, html });
  } catch (err) {
    console.error("[email:kyc-rejected]", (err as Error).message);
  }
}

/** Prestation publiée : confirmation et incitation à booster, avec les offres réelles. */
export async function sendServicePublishedEmail(opts: {
  to: string;
  firstName: string;
  serviceTitle: string;
  serviceId: string;
  locale: Locale;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    const offers: BoostOffer[] = BOOST_TIERS.map((tier) => ({
      name: tier.charAt(0).toUpperCase() + tier.slice(1),
      price: formatMoney(BOOSTS[tier].priceMinor, "XOF", opts.locale),
      placements: BOOSTS[tier].placements,
    }));
    const html = renderServicePublishedEmail({
      firstName: opts.firstName,
      serviceTitle: opts.serviceTitle,
      serviceUrl: `${SITE_URL}/services/${opts.serviceId}`,
      boostUrl: `${SITE_URL}/dashboard/boost`,
      offers,
      locale: opts.locale,
      siteUrl: SITE_URL,
    });
    const subject = opts.locale === "en"
      ? `Your service “${opts.serviceTitle}” is live`
      : `Votre prestation « ${opts.serviceTitle} » est en ligne`;
    await resend.emails.send({ from: FROM, to: opts.to, subject, html });
  } catch (err) {
    console.error("[email:service-published]", (err as Error).message);
  }
}

/** Relance de boost : envoyée seulement par la tâche planifiée, jamais à la main. */
export async function sendBoostReminderEmail(opts: {
  to: string;
  firstName: string;
  serviceTitle: string;
  locale: Locale;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  try {
    const offers: BoostOffer[] = BOOST_TIERS.map((tier) => ({
      name: tier.charAt(0).toUpperCase() + tier.slice(1),
      price: formatMoney(BOOSTS[tier].priceMinor, "XOF", opts.locale),
      placements: BOOSTS[tier].placements,
    }));
    const html = renderBoostReminderEmail({
      firstName: opts.firstName,
      serviceTitle: opts.serviceTitle,
      boostUrl: `${SITE_URL}/dashboard/boost`,
      offers,
      locale: opts.locale,
      siteUrl: SITE_URL,
    });
    const subject = opts.locale === "en" ? "Get your service noticed" : "Faites remarquer votre prestation";
    await resend.emails.send({ from: FROM, to: opts.to, subject, html });
    return true;
  } catch (err) {
    console.error("[email:boost-reminder]", (err as Error).message);
    return false;
  }
}

/** Demande de contact : l'équipe reçoit le message, répondre écrit directement au prestataire. */
export async function sendSupportRequestEmail(opts: {
  fromEmail: string;
  fromName: string;
  role: string;
  subject: string;
  body: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  try {
    const to = process.env.SUPPORT_EMAIL ?? "support@toomny.com";
    const text = [
      `De : ${opts.fromName} <${opts.fromEmail}> (${opts.role})`,
      "",
      opts.body,
    ].join("\n");
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: opts.fromEmail,
      subject: `[Contact] ${opts.subject}`,
      text,
    });
    return true;
  } catch (err) {
    console.error("[email:support]", (err as Error).message);
    return false;
  }
}
