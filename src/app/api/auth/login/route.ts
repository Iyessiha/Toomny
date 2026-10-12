import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clientIp, emailFingerprint, verifyTurnstile } from "@/lib/request-security";
import { LOCALE_COOKIE } from "@/i18n/locale-detection";

const WINDOW_SECONDS = 15 * 60;
const MAX_PER_IP = 30;
const MAX_PER_EMAIL = 10;

const MESSAGES = {
  fr: {
    required: "Email et mot de passe requis.",
    invalid: "Adresse e-mail ou mot de passe incorrect.",
    unconfirmed: "Confirmez votre e-mail avant de vous connecter.",
    rateLimited: "Trop de tentatives. Réessayez dans quelques minutes.",
    captcha: "Vérification anti-robot échouée. Réessayez.",
    badRequest: "Requête invalide.",
  },
  en: {
    required: "Email and password are required.",
    invalid: "Incorrect email or password.",
    unconfirmed: "Please confirm your email before logging in.",
    rateLimited: "Too many attempts. Try again in a few minutes.",
    captcha: "Anti-bot check failed. Try again.",
    badRequest: "Invalid request.",
  },
} as const;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value === "en" ? "en" : "fr";
  const m = MESSAGES[locale];

  let body: { email?: unknown; password?: unknown; turnstileToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: m.badRequest }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const token = typeof body.turnstileToken === "string" ? body.turnstileToken : null;

  if (!email || !password) return NextResponse.json({ error: m.required }, { status: 400 });

  const ip = clientIp(request);
  const ipOk = await consumeRateLimit(`login:ip:${ip}`, MAX_PER_IP, WINDOW_SECONDS);
  const emailOk = await consumeRateLimit(`login:email:${emailFingerprint(email)}`, MAX_PER_EMAIL, WINDOW_SECONDS);
  if (!ipOk || !emailOk) return NextResponse.json({ error: m.rateLimited }, { status: 429 });

  if (!(await verifyTurnstile(token, ip))) {
    return NextResponse.json({ error: m.captcha }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes("Invalid login credentials")) return NextResponse.json({ error: m.invalid }, { status: 401 });
    if (error.message.includes("Email not confirmed")) return NextResponse.json({ error: m.unconfirmed }, { status: 403 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Le profil est la source de vérité : la langue suit l’utilisateur sur tous ses appareils.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_locale")
      .eq("id", user.id)
      .maybeSingle();
    const preferred = profile?.preferred_locale === "en" ? "en" : ("fr" as const);
    response.cookies.set(LOCALE_COOKIE, preferred, { path: "/", maxAge: 365 * 24 * 3600, sameSite: "lax" });
  }
  return response;
}
