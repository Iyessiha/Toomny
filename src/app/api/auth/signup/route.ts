import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clientIp, emailFingerprint, verifyTurnstile } from "@/lib/request-security";
import { validateEmail, normalizePhone } from "@/lib/email-guard";
import { LOCALE_COOKIE } from "@/i18n/locale-detection";
import { sendWelcomeEmail } from "@/lib/email";

const WINDOW_SECONDS = 60 * 60;
const MAX_PER_IP = 10;
const MAX_PER_EMAIL = 3;

const MESSAGES = {
  fr: {
    invalid: "Vérifiez les informations saisies.",
    emailFormat: "Adresse e-mail invalide.",
    emailDisposable: "Les adresses e-mail temporaires ne sont pas acceptées.",
    emailNoMx: "Ce domaine e-mail n'existe pas ou ne peut pas recevoir de messages.",
    phoneInvalid: "Numéro de téléphone invalide pour ce pays.",
    rateLimited: "Trop de tentatives. Réessayez plus tard.",
    captcha: "Vérification anti-robot échouée. Réessayez.",
    exists: "Cette adresse est déjà utilisée. Connectez-vous.",
    failed: "Le compte n'a pas pu être créé. Réessayez.",
  },
  en: {
    invalid: "Please check the information you entered.",
    emailFormat: "Invalid email address.",
    emailDisposable: "Temporary email addresses are not accepted.",
    emailNoMx: "This email domain does not exist or cannot receive messages.",
    phoneInvalid: "Invalid phone number for this country.",
    rateLimited: "Too many attempts. Try again later.",
    captcha: "Anti-bot check failed. Try again.",
    exists: "This address is already used. Please log in.",
    failed: "The account could not be created. Try again.",
  },
} as const;

/**
 * Inscription passée par le serveur : limitation par IP et par e-mail, CAPTCHA,
 * et validation des champs. Le rôle est borné ici ; la base le borne aussi (trigger).
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value === "en" ? "en" : "fr";
  const m = MESSAGES[locale];

  let b: Record<string, unknown>;
  try {
    b = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: m.invalid }, { status: 400 });
  }
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

  const email = str(b.email, 254).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const firstName = str(b.first_name, 60);
  const lastName = str(b.last_name, 60);
  const country = str(b.country_code, 2).toUpperCase();
  const role = b.role === "provider" ? "provider" : "client";
  const token = typeof b.turnstileToken === "string" ? b.turnstileToken : null;
  const rawPhone = str(b.phone, 30);

  // Validations de base (synchrones)
  if (password.length < 8 || password.length > 72 || !firstName || !lastName || !/^[A-Z]{2}$/.test(country)) {
    return NextResponse.json({ error: m.invalid }, { status: 400 });
  }

  // Validation téléphone (optionnel mais vérifié si fourni)
  let phone = "";
  if (rawPhone) {
    const normalized = normalizePhone(rawPhone, country);
    if (!normalized) return NextResponse.json({ error: m.phoneInvalid }, { status: 400 });
    phone = normalized;
  }

  const ip = clientIp(request);
  const ipOk = await consumeRateLimit(`signup:ip:${ip}`, MAX_PER_IP, WINDOW_SECONDS);
  const emailOk = await consumeRateLimit(`signup:email:${emailFingerprint(email)}`, MAX_PER_EMAIL, WINDOW_SECONDS);
  if (!ipOk || !emailOk) return NextResponse.json({ error: m.rateLimited }, { status: 429 });

  if (!(await verifyTurnstile(token, ip))) return NextResponse.json({ error: m.captcha }, { status: 400 });

  // Validation email approfondie (async : DNS MX + blocklist)
  const emailError = await validateEmail(email);
  if (emailError === "format") return NextResponse.json({ error: m.emailFormat }, { status: 400 });
  if (emailError === "disposable") return NextResponse.json({ error: m.emailDisposable }, { status: 400 });
  if (emailError === "no_mx") return NextResponse.json({ error: m.emailNoMx }, { status: 400 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const origin = new URL(request.url).origin;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/dashboard`,
      data: {
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        phone,
        city: str(b.city, 80),
        country_code: country,
        role,
        preferred_locale: locale,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) return NextResponse.json({ error: m.exists }, { status: 409 });
    return NextResponse.json({ error: m.failed }, { status: 400 });
  }

  void sendWelcomeEmail({ to: email, firstName, locale });

  return NextResponse.json({ success: true });
}
