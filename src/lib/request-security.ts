import { createHash } from "node:crypto";

/** Adresse IP du client derrière le proxy Vercel. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Empreinte d'un e-mail pour les compteurs : la base ne stocke jamais l'adresse en clair. */
export function emailFingerprint(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Vérification Cloudflare Turnstile. Sans TURNSTILE_SECRET_KEY, le contrôle est
 * désactivé : à configurer en production (voir .env.example).
 */
export async function verifyTurnstile(token: string | null, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch (err) {
    console.error("verifyTurnstile:", err);
    return false;
  }
}
