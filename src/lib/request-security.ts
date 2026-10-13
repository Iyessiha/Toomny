import { createHash } from "node:crypto";

/**
 * Adresse IP du client derrière le proxy Vercel.
 * x-real-ip est posé par Vercel Edge (non forgeable par le client).
 * Fallback : dernier IP de x-forwarded-for — ajouté par le proxy le plus proche,
 * pas par le client. Ne jamais prendre le premier (contrôlé par le client).
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[parts.length - 1].trim();
  }
  return "unknown";
}

const IMAGE_MAGIC: Array<{ mime: string; check: (b: Uint8Array) => boolean }> = [
  {
    mime: "image/jpeg",
    check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    // WebP : signature RIFF....WEBP
    mime: "image/webp",
    check: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

/**
 * Détecte le vrai type MIME d'un buffer image via ses octets magiques.
 * Retourne null si le buffer ne correspond à aucun type autorisé (jpeg/png/webp).
 * Résiste au spoofing Content-Type côté client.
 */
export function imageMimeFromBytes(buf: Uint8Array): string | null {
  for (const { mime, check } of IMAGE_MAGIC) {
    if (check(buf)) return mime;
  }
  return null;
}

/** Empreinte d'un e-mail pour les compteurs : la base ne stocke jamais l'adresse en clair. */
export function emailFingerprint(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Vérification Cloudflare Turnstile.
 * En production, TURNSTILE_SECRET_KEY est obligatoire — son absence lève une erreur
 * au lieu de laisser passer silencieusement toutes les requêtes.
 */
export async function verifyTurnstile(token: string | null, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("TURNSTILE_SECRET_KEY manquante en production");
    }
    return true; // dev uniquement
  }
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
