import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clientIp, emailFingerprint, verifyTurnstile } from "@/lib/request-security";
import { LOCALE_COOKIE } from "@/i18n/locale-detection";

const WINDOW_SECONDS = 60 * 60;
const MAX_PER_IP = 10;
const MAX_PER_EMAIL = 3;

const MESSAGES = {
  fr: {
    invalid: "Vérifiez les informations saisies.",
    rateLimited: "Trop de tentatives. Réessayez plus tard.",
    captcha: "Vérification anti-robot échouée. Réessayez.",
    exists: "Cette adresse est déjà utilisée. Connectez-vous.",
    failed: "Le compte n'a pas pu être créé. Réessayez.",
  },
  en: {
    invalid: "Please check the information you entered.",
    rateLimited: "Too many attempts. Try again later.",
    captcha: "Anti-bot check failed. Try again.",
    exists: "This address is already used. Please log in.",
    failed: "The account could not be created. Try again.",
  },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const email = str(b.email, 254);
  const password = typeof b.password === "string" ? b.password : "";
  const firstName = str(b.first_name, 60);
  const lastName = str(b.last_name, 60);
  const country = str(b.country_code, 2).toUpperCase();
  const role = b.role === "provider" ? "provider" : "client";
  const token = typeof b.turnstileToken === "string" ? b.turnstileToken : null;

  if (!EMAIL_RE.test(email) || password.length < 8 || password.length > 72 || !firstName || !lastName || !/^[A-Z]{2}$/.test(country)) {
    return NextResponse.json({ error: m.invalid }, { status: 400 });
  }

  const ip = clientIp(request);
  const ipOk = await consumeRateLimit(`signup:ip:${ip}`, MAX_PER_IP, WINDOW_SECONDS);
  const emailOk = await consumeRateLimit(`signup:email:${emailFingerprint(email)}`, MAX_PER_EMAIL, WINDOW_SECONDS);
  if (!ipOk || !emailOk) return NextResponse.json({ error: m.rateLimited }, { status: 429 });

  if (!(await verifyTurnstile(token, ip))) return NextResponse.json({ error: m.captcha }, { status: 400 });

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
        phone: str(b.phone, 30),
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
  return NextResponse.json({ success: true });
}
