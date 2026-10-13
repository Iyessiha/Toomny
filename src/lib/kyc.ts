/**
 * KYC — Vérification d'identité
 *
 * Flux : l'utilisateur téléverse un document d'identité (recto + selfie).
 * Un admin passe en revue via /admin/verifications et approuve ou rejette.
 *
 * Les documents sont stockés dans le bucket privé `kyc-documents`, jamais
 * accessibles publiquement. Seul l'utilisateur propriétaire et les admins
 * (via service role) peuvent les lire.
 */

// Types de documents acceptés — adaptés aux pièces courantes en UEMOA.
export const DOCUMENT_TYPES = [
  { value: "cni", label: "Carte Nationale d'Identité (CNI)" },
  { value: "passeport", label: "Passeport" },
  { value: "permis", label: "Permis de conduire" },
  { value: "carte_sejour", label: "Carte de séjour" },
  { value: "attestation", label: "Attestation d'identité" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

export const VERIFICATION_STATUS_TONE: Record<string, string> = {
  unverified: "bg-neutral-100 text-neutral-600",
  pending: "bg-amber-50 text-amber-700",
  verified: "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]",
  rejected: "bg-red-50 text-red-700",
  manual_review: "bg-blue-50 text-blue-700",
};

export const KYC_COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Sénégal" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "BJ", name: "Bénin" },
  { code: "TG", name: "Togo" },
  { code: "NE", name: "Niger" },
  { code: "GW", name: "Guinée-Bissau" },
  { code: "CM", name: "Cameroun" },
] as const;

export const KYC_MAX_BYTES = 10 * 1024 * 1024;

/** Types MIME acceptés et extension de stockage correspondante. */
export const KYC_MIME_EXT: Record<string, "jpg" | "png" | "webp" | "pdf"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * Vérifie les premiers octets du fichier. Le type MIME vient du navigateur et
 * peut être forgé : on exige la signature réelle du format annoncé.
 */
export function matchesMagicBytes(buf: Uint8Array, mime: string): boolean {
  const starts = (sig: number[], offset = 0) =>
    sig.every((b, i) => buf[offset + i] === b);

  switch (mime) {
    case "image/jpeg":
      return starts([0xff, 0xd8, 0xff]);
    case "image/png":
      return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      // "RIFF" <taille> "WEBP"
      return starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8);
    case "application/pdf":
      return starts([0x25, 0x50, 0x44, 0x46]); // "%PDF"
    default:
      return false;
  }
}

/** Chemin dans le bucket : <userId>/<timestamp>_<side>.<ext>, ext issue du type MIME validé. */
export function kycStoragePath(userId: string, ext: string, side: string): string {
  const ts = Date.now();
  return `${userId}/${ts}_${side}.${ext}`;
}

/** Date de naissance valide, au format AAAA-MM-JJ, et âge minimum de 18 ans. */
export function isValidAdultDob(value: string, now: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return false;
  const eighteen = new Date(Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate()));
  return d <= eighteen && d.getUTCFullYear() > 1900;
}
