import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clientIp, emailFingerprint } from "@/lib/request-security";
import { LOCALE_COOKIE } from "@/i18n/locale-detection";

const WINDOW_SECONDS = 60 * 60;
const MAX_PER_IP = 5;
const MAX_PER_EMAIL = 3;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value === "en" ? "en" : "fr";

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: true }); // fail silent
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) return NextResponse.json({ success: true }); // fail silent

  const ip = clientIp(request);
  const ipOk = await consumeRateLimit(`forgot:ip:${ip}`, MAX_PER_IP, WINDOW_SECONDS);
  const emailOk = await consumeRateLimit(`forgot:email:${emailFingerprint(email)}`, MAX_PER_EMAIL, WINDOW_SECONDS);
  // On ne révèle pas le rate-limit non plus (protection enum)
  if (!ipOk || !emailOk) return NextResponse.json({ success: true });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const origin = new URL(request.url).origin;
  const redirectTo = locale === "en"
    ? `${origin}/en/auth/reset-password`
    : `${origin}/auth/reset-password`;

  // On ignore l'erreur : on ne révèle jamais si l'adresse existe.
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  return NextResponse.json({ success: true });
}
