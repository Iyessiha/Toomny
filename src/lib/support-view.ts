// Mise en forme des conversations de support pour la messagerie. Pure : les
// dates sont formatées par l'appelant, et les liens signés sont fournis.
import type { PaneMessage, PaneRole } from "@/components/messaging/conversation-pane";
import { quoteSnippet } from "@/lib/support-attachments";

export type RawReply = {
  id: string;
  body: string;
  created_at: string;
  author_role: PaneRole;
  quoted_role: PaneRole | null;
  quoted_body: string | null;
};

export type RawRequest = {
  id: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  awaiting_admin: boolean;
  requester_seen_at?: string | null;
  replies: RawReply[];
};

export type RawAttachment = { id: string; request_id: string; reply_id: string | null };

/** Fil complet d'une demande : message d'origine, puis réponses, dans l'ordre chronologique. */
export function buildThread(
  req: RawRequest,
  attachments: RawAttachment[],
  urls: Map<string, string>,
  formatTime: (iso: string) => string,
): PaneMessage[] {
  const originalAt = req.created_at;
  const messages: { at: string; message: PaneMessage }[] = [
    {
      at: originalAt,
      message: {
        id: `req-${req.id}`,
        role: "requester",
        body: req.body,
        timeLabel: formatTime(originalAt),
        quote: null,
        attachments: [],
      },
    },
    ...req.replies.map((r) => ({
      at: r.created_at,
      message: {
        id: r.id,
        role: r.author_role,
        body: r.body,
        timeLabel: formatTime(r.created_at),
        quote: r.quoted_role && r.quoted_body ? { role: r.quoted_role, body: r.quoted_body } : null,
        attachments: attachments
          .filter((a) => a.reply_id === r.id)
          .map((a) => ({ id: a.id, url: urls.get(a.id) ?? null })),
      },
    })),
  ];
  return messages.sort((a, b) => a.at.localeCompare(b.at)).map((m) => m.message);
}

/** Dernier message de l'équipe, pour savoir si le demandeur a du nouveau. */
export function lastTeamMessageAt(req: RawRequest): string | null {
  const team = req.replies.filter((r) => r.author_role === "admin").map((r) => r.created_at);
  if (team.length === 0) return null;
  return team.sort().at(-1) ?? null;
}

/** Vrai si l'équipe a répondu depuis la dernière ouverture par le demandeur. */
export function hasUnreadTeamReply(req: RawRequest): boolean {
  const last = lastTeamMessageAt(req);
  if (!last) return false;
  return !req.requester_seen_at || last > req.requester_seen_at;
}

/** Aperçu d'une conversation : le dernier message, en une ligne. */
export function previewOf(req: RawRequest): string {
  const all = [{ at: req.created_at, body: req.body }, ...req.replies.map((r) => ({ at: r.created_at, body: r.body }))];
  const last = all.sort((a, b) => a.at.localeCompare(b.at)).at(-1);
  return last ? quoteSnippet(last.body) : "";
}
