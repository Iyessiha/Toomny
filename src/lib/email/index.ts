import "server-only";
import { Resend } from "resend";
import type { Locale } from "@/i18n/dictionaries";
import type { NotificationType } from "@/lib/notifications";
import type { NotificationParams } from "@/i18n/notifications";
import { getNotificationTexts } from "@/i18n/notifications";
import { renderWelcomeEmail } from "./templates/welcome";
import { renderNotificationEmail } from "./templates/notification";

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
