// Pièces jointes de la messagerie de support (captures d'écran). Règles pures,
// sans accès au stockage : partagées par la route d'envoi et les formulaires.

export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const ATTACHMENTS_PER_MESSAGE = 4;
/** Une pièce jointe envoyée mais jamais rattachée à un message est supprimée après ce délai. */
export const ORPHAN_RETENTION_MS = 24 * 60 * 60 * 1000;
/** Taille maximale de l'extrait cité dans une réponse. */
export const QUOTE_MAX_CHARS = 200;

export const ALLOWED_ATTACHMENT_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
export type AttachmentMime = (typeof ALLOWED_ATTACHMENT_MIME)[number];

export function attachmentExtension(mime: AttachmentMime): string {
  return mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
}

/** Valide une image avant stockage. Le type réel est revérifié à partir des octets. */
export function validateAttachment(input: { bytes: number; mime: string | null }): { ok: true } | { error: string } {
  if (!input.mime || !(ALLOWED_ATTACHMENT_MIME as readonly string[]).includes(input.mime)) {
    return { error: "Format non accepté. Envoyez une image PNG, JPEG ou WebP." };
  }
  if (input.bytes <= 0) return { error: "Le fichier est vide." };
  if (input.bytes > ATTACHMENT_MAX_BYTES) return { error: "Image trop volumineuse (5 Mo max)." };
  return { ok: true };
}

/** Extrait court d'un message, pour la citation. Coupé proprement, sans les sauts de ligne. */
export function quoteSnippet(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= QUOTE_MAX_CHARS) return flat;
  return `${flat.slice(0, QUOTE_MAX_CHARS - 1).trimEnd()}…`;
}

/** Chemin de stockage : un dossier par demande, nom aléatoire (jamais le nom d'origine). */
export function attachmentStoragePath(requestId: string, uuid: string, mime: AttachmentMime): string {
  return `${requestId}/${uuid}.${attachmentExtension(mime)}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Liste d'identifiants de pièces jointes envoyée par le formulaire : sans doublon, bornée. */
export function parseAttachmentIds(raw: unknown): string[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  const ids = raw.split(",").map((s) => s.trim()).filter((s) => UUID.test(s));
  return [...new Set(ids)].slice(0, ATTACHMENTS_PER_MESSAGE);
}

/** Citation envoyée par le formulaire, bornée côté serveur. Vide si le rôle ou le texte manquent. */
export function readQuoteFields(get: (key: string) => FormDataEntryValue | null): {
  quoted_role?: "admin" | "requester";
  quoted_body?: string;
} {
  const role = get("quoteRole");
  const body = String(get("quoteBody") ?? "");
  if ((role !== "admin" && role !== "requester") || body.trim() === "") return {};
  return { quoted_role: role, quoted_body: quoteSnippet(body).slice(0, QUOTE_MAX_CHARS) };
}
