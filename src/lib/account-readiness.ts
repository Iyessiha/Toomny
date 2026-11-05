// Conformité d'un compte : ce qui permet de publier, et ce qui reste à faire.
// Fonction pure. Les règles reprennent celles du site : e-mail confirmé et
// identité vérifiée sont requis pour publier une prestation (sinon elle reste
// en brouillon, voir la page Prestations et les garde-fous de l'espace prestataire).

export type ReadinessInput = {
  emailConfirmed: boolean;
  verificationStatus: string;
  role: string;
  profile: {
    headline: string | null;
    bio: string | null;
    city: string | null;
    skills: string | null;
    avatarUrl: string | null;
  } | null;
};

export type ReadinessCheck = {
  key: "email" | "identity" | "headline" | "bio" | "city" | "skills" | "avatar";
  label: string;
  ok: boolean;
  /** Bloquant pour publier. Les autres sont des améliorations du profil. */
  blocking: boolean;
  hint: string;
};

export type Readiness = {
  checks: ReadinessCheck[];
  /** Vrai quand tous les prérequis bloquants sont remplis. */
  canPublish: boolean;
  /** Vrai quand le profil est entièrement rempli (y compris les améliorations). */
  profileComplete: boolean;
  missing: ReadinessCheck[];
};

export const BIO_MIN_CHARS = 80;
export const SKILLS_MIN = 2;

const count = (csv: string | null) => (csv ?? "").split(",").map((s) => s.trim()).filter(Boolean).length;

export function accountReadiness(input: ReadinessInput): Readiness {
  const p = input.profile;
  const isProvider = input.role === "provider" || input.role === "both";
  const checks: ReadinessCheck[] = [
    {
      key: "email",
      label: "Adresse e-mail confirmée",
      ok: input.emailConfirmed,
      blocking: true,
      hint: "Cliquez sur le lien reçu par e-mail. Vérifiez aussi les spams.",
    },
    {
      key: "identity",
      label: "Identité vérifiée",
      ok: input.verificationStatus === "verified",
      blocking: true,
      hint: "Envoyez une pièce d'identité dans « Vérification ». Un prestataire non vérifié ne peut pas publier.",
    },
    {
      key: "headline",
      label: "Titre du profil",
      ok: (p?.headline ?? "").trim().length >= 10,
      blocking: false,
      hint: "Un titre clair de 10 caractères minimum, par exemple « Graphiste logo et identité visuelle ».",
    },
    {
      key: "bio",
      label: "Présentation",
      ok: (p?.bio ?? "").trim().length >= BIO_MIN_CHARS,
      blocking: false,
      hint: `Quelques phrases de ${BIO_MIN_CHARS} caractères minimum : votre expérience et ce que vous livrez.`,
    },
    {
      key: "city",
      label: "Ville",
      ok: (p?.city ?? "").trim().length > 0,
      blocking: false,
      hint: "Indiquez votre ville pour que les clients vous trouvent.",
    },
    {
      key: "skills",
      label: "Compétences",
      ok: count(p?.skills ?? null) >= SKILLS_MIN,
      blocking: false,
      hint: `Au moins ${SKILLS_MIN} compétences, séparées par des virgules.`,
    },
    {
      key: "avatar",
      label: "Photo de profil",
      ok: Boolean(p?.avatarUrl),
      blocking: false,
      hint: "Une photo claire inspire confiance aux clients.",
    },
  ];

  const blockingOk = checks.filter((c) => c.blocking).every((c) => c.ok);
  // Le profil ne couvre que la fiche publique : e-mail et identité sont des prérequis du compte.
  const profileComplete = checks.filter((c) => c.key !== "email" && c.key !== "identity").every((c) => c.ok);
  const missing = checks.filter((c) => !c.ok);
  return {
    checks,
    canPublish: isProvider && blockingOk,
    profileComplete: isProvider && profileComplete,
    missing,
  };
}

/** Résumé en français pour le contexte de l'IA : ce qui est fait, ce qui manque, et pourquoi. */
export function readinessSummary(r: Readiness): string {
  const done = r.checks.filter((c) => c.ok).map((c) => c.label);
  const todo = r.missing.map((c) => `${c.label} (${c.blocking ? "bloquant" : "recommandé"} : ${c.hint})`);
  return [
    `Peut publier une prestation : ${r.canPublish ? "oui" : "non"}`,
    `Éléments faits : ${done.length ? done.join(", ") : "aucun"}`,
    `Éléments manquants : ${todo.length ? todo.join(" ; ") : "aucun"}`,
  ].join("\n");
}

export type AccountFacts = {
  role: string;
  emailConfirmed: boolean;
  verificationStatus: string;
  headline: string | null;
  bio: string | null;
  city: string | null;
  skills: string | null;
  hasAvatar: boolean;
};

/**
 * Valeurs réelles du compte pour l'analyse. Les textes saisis par l'utilisateur
 * sont délimités : ce sont des données à évaluer, jamais des consignes.
 */
export function accountFactsText(f: AccountFacts): string {
  const bio = (f.bio ?? "").trim();
  const skills = (f.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return [
    `Rôle : ${f.role}`,
    `E-mail confirmé : ${f.emailConfirmed ? "oui" : "non"}`,
    `Vérification d'identité : ${f.verificationStatus}`,
    `Titre (${(f.headline ?? "").trim().length} caractères) : <donnee>${(f.headline ?? "").trim() || "vide"}</donnee>`,
    `Présentation (${bio.length} caractères, minimum ${BIO_MIN_CHARS}) : <donnee>${bio || "vide"}</donnee>`,
    `Ville : ${f.city?.trim() ? `<donnee>${f.city.trim()}</donnee>` : "vide"}`,
    `Compétences (${skills.length}, minimum ${SKILLS_MIN}) : ${skills.length ? skills.map((s) => `<donnee>${s}</donnee>`).join(", ") : "aucune"}`,
    `Photo de profil : ${f.hasAvatar ? "oui" : "non"}`,
  ].join("\n");
}
