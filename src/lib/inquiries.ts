// ---------------------------------------------------------------------------
// Demandes de contact avant commande (table `inquiries`).
//
// Une demande est un message isolé ; une conversation regroupe tous les
// échanges entre deux personnes à propos d'une même prestation (ou sans
// prestation pour le contact direct). Le regroupement est une fonction pure
// sur des lignes déjà chargées : pas de requête par conversation.
// ---------------------------------------------------------------------------

export type InquiryRow = {
  id: string;
  from_id: string;
  to_id: string;
  service_id: string | null;
  message: string;
  read_at: string | null;
  created_at: string;
};

export type InquiryConversation = {
  /** Paire triée + prestation : stable quel que soit le sens d'écriture. */
  key: string;
  otherId: string;
  serviceId: string | null;
  messages: InquiryRow[];
  unread: number;
  lastAt: string;
};

export function conversationKey(a: string, b: string, serviceId: string | null): string {
  const [first, second] = a < b ? [a, b] : [b, a];
  return `${first}__${second}__${serviceId ?? "direct"}`;
}

/**
 * Regroupe des demandes en conversations, triées par activité récente.
 * Les messages d'une conversation sont en ordre chronologique. `myId`
 * sert à compter les non-lus (reçus par moi, sans `read_at`).
 */
export function groupInquiries(rows: InquiryRow[], myId: string): InquiryConversation[] {
  const byKey = new Map<string, InquiryConversation>();

  for (const row of rows) {
    if (row.from_id !== myId && row.to_id !== myId) continue;
    const otherId = row.from_id === myId ? row.to_id : row.from_id;
    const key = conversationKey(row.from_id, row.to_id, row.service_id);
    const existing = byKey.get(key);
    if (existing) {
      existing.messages.push(row);
    } else {
      byKey.set(key, {
        key,
        otherId,
        serviceId: row.service_id,
        messages: [row],
        unread: 0,
        lastAt: row.created_at,
      });
    }
  }

  const conversations = [...byKey.values()];
  for (const c of conversations) {
    c.messages.sort((x, y) => x.created_at.localeCompare(y.created_at));
    c.lastAt = c.messages[c.messages.length - 1].created_at;
    c.unread = c.messages.filter((m) => m.to_id === myId && !m.read_at).length;
  }
  conversations.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  return conversations;
}
