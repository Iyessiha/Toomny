import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { emailFingerprint } from "@/lib/request-security";
import { sendConfirmEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_SECONDS = 60 * 60;
const MAX_PER_EMAIL = 5;

/**
 * Renvoie le lien de confirmation à l'utilisateur connecté, par Resend.
 * Réservé à la session en cours : on ne renvoie rien à une adresse saisie au hasard.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.emailConfirmed) return NextResponse.json({ success: true, alreadyConfirmed: true });

  const allowed = await consumeRateLimit(`resend-confirm:${emailFingerprint(user.email)}`, MAX_PER_EMAIL, WINDOW_SECONDS);
  if (!allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const origin = new URL(request.url).origin;
  const { data: link, error } = await createAdminClient().auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
    options: { redirectTo: `${origin}/dashboard` },
  });
  if (error || !link?.properties?.action_link) {
    console.error("[resend-confirmation]", error?.message);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  const confirmUrl = `${origin}/auth/confirm?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=magiclink&next=/dashboard`;
  const sent = await sendConfirmEmail({ to: user.email, confirmUrl, locale: user.preferredLocale });
  if (!sent) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}
