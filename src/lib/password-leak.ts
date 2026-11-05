// Mots de passe divulgués (HaveIBeenPwned, API « Pwned Passwords »).
// Seul le préfixe SHA-1 (5 caractères) quitte le serveur : la comparaison
// du reste se fait en local. Ainsi le mot de passe n'est jamais transmis.
// Si l'API est injoignable, on laisse passer et on journalise : une panne
// d'un tiers ne doit pas bloquer l'inscription.

const RANGE_URL = "https://api.pwnedpasswords.com/range/";
const TIMEOUT_MS = 3000;

export async function sha1Upper(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Renvoie le nombre d'apparitions si le suffixe figure dans la réponse de l'API, 0 sinon. */
export function countInRange(suffix: string, body: string): number {
  for (const line of body.split("\n")) {
    const [hash, count] = line.trim().split(":");
    if (hash === suffix) {
      const n = Number(count);
      return Number.isFinite(n) ? n : 0;
    }
  }
  return 0;
}

/** true si le mot de passe figure dans une fuite connue. */
export async function isLeakedPassword(password: string): Promise<boolean> {
  const hash = await sha1Upper(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  try {
    const res = await fetch(`${RANGE_URL}${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return false;
    return countInRange(suffix, await res.text()) > 0;
  } catch (err) {
    console.error("[password-leak] API indisponible:", (err as Error).message);
    return false;
  }
}

export const LEAKED_PASSWORD_MESSAGE = {
  fr: "Ce mot de passe figure dans une fuite de données connue. Choisissez-en un autre.",
  en: "This password appears in a known data breach. Please choose another one.",
} as const;
