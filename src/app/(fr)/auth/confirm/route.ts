import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Validation des liens envoyés par Toomny (confirmation d'adresse, connexion par lien).
 * Le jeton haché est vérifié ici, côté serveur : le lien reste sur le domaine Toomny.
 */
const TYPES: EmailOtpType[] = ["signup", "magiclink", "email"];

/** Redirection interne uniquement : pas d'adresse externe ni de chemin protocole-relatif. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: NextRequest): Promise<Response> {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(url.searchParams.get("next"));

  if (!tokenHash || !type || !TYPES.includes(type)) {
    return NextResponse.redirect(new URL("/auth?error=lien", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    return NextResponse.redirect(new URL("/auth?error=lien", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
