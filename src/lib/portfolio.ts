/** Nombre maximum de réalisations publiées sur la vitrine d'un prestataire. */
export const MAX_PORTFOLIO_ITEMS = 12;

export const PORTFOLIO_KINDS = ["video", "work", "link"] as const;
export type PortfolioKind = (typeof PORTFOLIO_KINDS)[number];

export type PortfolioInput = { kind: string; title: string; description: string; url: string };
export type PortfolioError = "kind" | "title" | "description" | "url";

const URL_RE = /^https:\/\/[^\s]{4,500}$/i;

/** Valide une réalisation : lien https uniquement, titre et description bornés. Pure. */
export function validatePortfolioItem(
  input: PortfolioInput,
): { ok: true; value: { kind: PortfolioKind; title: string; description: string | null; url: string } } | { ok: false; error: PortfolioError } {
  if (!(PORTFOLIO_KINDS as readonly string[]).includes(input.kind)) return { ok: false, error: "kind" };

  const title = input.title.trim();
  if (!title || title.length > 80) return { ok: false, error: "title" };

  const description = input.description.trim();
  if (description.length > 300) return { ok: false, error: "description" };

  const url = input.url.trim();
  if (!URL_RE.test(url)) return { ok: false, error: "url" };

  return {
    ok: true,
    value: { kind: input.kind as PortfolioKind, title, description: description || null, url },
  };
}

/** Nom court du site d'un lien, pour l'afficher sans l'adresse complète. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
