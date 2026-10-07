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

export const VERIFICATION_STATUS_FR: Record<string, string> = {
  unverified: "Non vérifié",
  pending: "En attente de revue",
  verified: "Vérifié",
  rejected: "Rejeté",
  manual_review: "Revue manuelle",
};

export const VERIFICATION_STATUS_TONE: Record<string, string> = {
  unverified: "bg-neutral-100 text-neutral-600",
  pending: "bg-amber-50 text-amber-700",
  verified: "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]",
  rejected: "bg-red-50 text-red-700",
  manual_review: "bg-blue-50 text-blue-700",
};

/** Chemin dans le bucket : kyc-documents/<userId>/<timestamp>_<side>.<ext> */
export function kycStoragePath(userId: string, fileName: string, side: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  const ts = Date.now();
  return `${userId}/${ts}_${side}.${ext}`;
}
