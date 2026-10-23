/** Réseaux proposés pour partager Toomny ou une prestation. */
export const SHARE_NETWORKS = ["whatsapp", "facebook", "x", "linkedin", "telegram"] as const;
export type ShareNetwork = (typeof SHARE_NETWORKS)[number];

/** Lien d'une page Toomny, marqué par réseau pour mesurer ce qui amène des visites et des commandes. */
export function trackedUrl(base: string, network: string, medium: string, campaign: string): string {
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}utm_source=${network}&utm_medium=${medium}&utm_campaign=${campaign}`;
}

/** Lien de partage d'un réseau, avec le texte et l'adresse à diffuser. */
export function shareHref(network: ShareNetwork, url: string, text: string): string {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  switch (network) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
  }
}
