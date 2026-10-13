import { promises as dns } from "node:dns";

/**
 * Domaines d'emails jetables, temporaires ou abus connus.
 * Liste à enrichir au fil des incidents. Sources : open-source blocklists +
 * services populaires sur les marchés UEMOA.
 */
const DISPOSABLE_DOMAINS = new Set([
  // Mailinator & variantes
  "mailinator.com", "mailinater.com", "mailinator2.com", "tradermail.info",
  // Guerrilla Mail
  "guerrillamail.com", "guerrillamail.info", "guerrillamail.biz",
  "guerrillamail.de", "guerrillamail.net", "guerrillamail.org",
  "grr.la", "spam4.me", "sharklasers.com", "guerrillamailblock.com",
  "spam.la", "spamgourmet.com", "spamgourmet.net", "spamgourmet.org",
  // Yopmail (très populaire en Afrique francophone)
  "yopmail.com", "yopmail.fr", "cool.fr.nf", "jetable.fr.nf",
  "nospam.ze.tc", "nomail.xl.cx", "mega.zik.dj", "speed.1s.fr",
  "courriel.fr.nf", "moncourrier.fr.nf", "monemail.fr.nf",
  "monmail.fr.nf",
  // Temp Mail & services populaires
  "tempmail.com", "temp-mail.org", "tempmail.net", "tempmailo.com",
  "throwam.com", "throwam.net", "dispostable.com", "maildrop.cc",
  "mailnull.com", "mailnesia.com", "mailnew.com",
  "spamgob.com", "spamhereplease.com", "spamhole.com",
  "10minutemail.com", "10minutemail.net", "10minutemail.org",
  "20minutemail.com", "minutemailbox.com",
  "trashmail.com", "trashmail.me", "trashmail.net", "trashmail.org",
  "trashmail.at", "trashmail.io", "trashmail.xyz",
  "throwam.com", "throwamv.com",
  "fakeinbox.com", "mailnull.com",
  "spambox.us", "spambox.info", "spambox.org",
  "filzmail.com", "sogetthis.com", "spamavert.com",
  "discard.email", "spamgob.net",
  "mytemp.email", "tempinbox.com", "tempinbox.co.uk",
  "mohmal.com", "boun.cr", "uggsrock.com",
  "sharklasers.com", "emailondeck.com",
  "jetable.com", "jetable.net", "jetable.org",
  "nospammail.net", "amilegit.com", "amikir.com",
  "gowikibooks.com", "gowikicampus.com", "gowikicars.com",
  "gowikifilms.com", "gowikigames.com", "gowikimusic.com",
  "gowikinet.com", "gowikistock.com", "gowikitv.com",
  // Autres connus
  "spamfree24.org", "spamfree.eu", "spamcero.com",
  "incognitomail.com", "incognitomail.net", "incognitomail.org",
  "mailexpire.com", "filzmail.com", "sogetthis.com",
  "no-spam.ws", "nospam.ze.tc", "spamcorptastic.com",
  "spamdecoy.net", "spamfree24.de", "spamgob.biz",
  "spaml.de", "spamthisplease.com",
  "tempr.email", "tmailor.com",
]);

/** Vérifie que le domaine email n'est pas dans la blocklist. */
export function isDisposableDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Vérifie que le domaine de l'email a au moins un enregistrement MX valide.
 * Un domaine sans MX ne peut pas recevoir d'emails.
 * Timeout 3 s pour ne pas bloquer l'inscription trop longtemps.
 */
export async function hasMxRecord(email: string): Promise<boolean> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    return Array.isArray(records) && records.length > 0;
  } catch {
    // Timeout ou NXDOMAIN : on rejette (fail-closed)
    return false;
  }
}

/**
 * Validation complète d'une adresse email :
 * 1. Regex stricte (RFC 5321 simplifié)
 * 2. Domaine non jetable
 * 3. MX record existant
 *
 * Retourne null si l'email est valide, ou un code d'erreur.
 */
export async function validateEmail(email: string): Promise<"format" | "disposable" | "no_mx" | null> {
  const EMAIL_STRICT = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!EMAIL_STRICT.test(email)) return "format";
  if (isDisposableDomain(email)) return "disposable";
  const hasMx = await hasMxRecord(email);
  if (!hasMx) return "no_mx";
  return null;
}

/**
 * Formats de téléphone valides par pays (indicatif + longueur des chiffres locaux).
 * Sources : ITU-T E.164, opérateurs locaux.
 */
const PHONE_RULES: Record<string, { dial: string; digits: number | number[] }> = {
  CI: { dial: "225", digits: 10 },   // 07 XX XX XX XX
  SN: { dial: "221", digits: 9 },    // 7X XXX XX XX
  ML: { dial: "223", digits: 8 },    // XX XX XX XX
  BF: { dial: "226", digits: 8 },    // XX XX XX XX
  GN: { dial: "224", digits: 9 },    // 6XX XX XX XX
  TG: { dial: "228", digits: 8 },    // XX XX XX XX
  BJ: { dial: "229", digits: 8 },    // XX XX XX XX
  NE: { dial: "227", digits: 8 },    // XX XX XX XX
  GW: { dial: "245", digits: 7 },    // XXX XXXX
  CM: { dial: "237", digits: 9 },    // 6XX XX XX XX
  NG: { dial: "234", digits: [10] }, // 0XX XXXX XXXX (sans le 0)
  GH: { dial: "233", digits: [9] },  // 0XX XXX XXXX (sans le 0)
  SL: { dial: "232", digits: 8 },
  LR: { dial: "231", digits: 7 },
  GM: { dial: "220", digits: 7 },
  MR: { dial: "222", digits: 8 },
  MA: { dial: "212", digits: [9] },
  DZ: { dial: "213", digits: 9 },
  TN: { dial: "216", digits: 8 },
  FR: { dial: "33",  digits: 9 },
  BE: { dial: "32",  digits: 9 },
  CH: { dial: "41",  digits: 9 },
  LU: { dial: "352", digits: [6, 9] },
  CA: { dial: "1",   digits: 10 },
  US: { dial: "1",   digits: 10 },
};

/**
 * Valide et normalise un numéro de téléphone selon le pays.
 * Accepte les formats +XXX..., 00XXX..., ou le numéro local seul.
 * Retourne le numéro normalisé E.164 (+XXXXXXXX) ou null si invalide.
 */
export function normalizePhone(raw: string, countryCode: string): string | null {
  if (!raw) return null;
  const rule = PHONE_RULES[countryCode];
  if (!rule) return null;

  // Supprimer tout sauf les chiffres et le +
  const cleaned = raw.replace(/[\s\-().]/g, "");

  let digits: string;
  if (cleaned.startsWith(`+${rule.dial}`)) {
    digits = cleaned.slice(1 + rule.dial.length);
  } else if (cleaned.startsWith(`00${rule.dial}`)) {
    digits = cleaned.slice(2 + rule.dial.length);
  } else if (/^\d+$/.test(cleaned)) {
    // Numéro local : peut commencer par 0 pour certains pays
    digits = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned;
  } else {
    return null;
  }

  // Vérifier la longueur
  const expected = rule.digits;
  const len = digits.length;
  const valid = Array.isArray(expected) ? expected.includes(len) : len === expected;
  if (!valid || !/^\d+$/.test(digits)) return null;

  return `+${rule.dial}${digits}`;
}
