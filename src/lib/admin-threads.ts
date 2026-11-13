import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDisplayNames } from "@/lib/names";

export type AdminThreadTab = "open" | "unread" | "closed";

export type AdminThreadRow = {
  id: string;
  subject: string;
  status: string;
  providerName: string;
  lastBody: string | null;
  lastFromProvider: boolean;
  lastAt: string | null;
  unread: number;
};

export function parseThreadTab(value: string | undefined): AdminThreadTab {
  return value === "closed" ? "closed" : value === "unread" ? "unread" : "open";
}

/** Fils de support avec dernier message et non-lus (côté admin : messages du prestataire sans `read_at`). */
export async function loadAdminThreads(tab: AdminThreadTab): Promise<{
  rows: AdminThreadRow[];
  counts: { open: number; unread: number; closed: number };
}> {
  const db = createAdminClient();

  const { data: threads } = await db
    .from("support_threads")
    .select("id, subject, status, provider_id, last_message_at")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(200);

  const all = threads ?? [];
  const names = await resolveDisplayNames([...new Set(all.map((th) => th.provider_id))]);

  const last = new Map<string, { body: string; fromProvider: boolean }>();
  const unread = new Map<string, number>();

  if (all.length > 0) {
    const byId = new Map(all.map((th) => [th.id, th]));
    const { data: msgs } = await db
      .from("support_messages")
      .select("thread_id, body, sender_id, read_at, created_at")
      .in("thread_id", all.map((th) => th.id))
      .order("created_at", { ascending: false });

    for (const m of msgs ?? []) {
      const th = byId.get(m.thread_id);
      if (!th) continue;
      const fromProvider = m.sender_id === th.provider_id;
      if (!last.has(m.thread_id)) last.set(m.thread_id, { body: m.body, fromProvider });
      if (fromProvider && !m.read_at) unread.set(m.thread_id, (unread.get(m.thread_id) ?? 0) + 1);
    }
  }

  const toRow = (th: (typeof all)[number]): AdminThreadRow => ({
    id: th.id,
    subject: th.subject,
    status: th.status,
    providerName: names.get(th.provider_id)?.name ?? th.provider_id.slice(0, 8),
    lastBody: last.get(th.id)?.body ?? null,
    lastFromProvider: last.get(th.id)?.fromProvider ?? false,
    lastAt: th.last_message_at,
    unread: unread.get(th.id) ?? 0,
  });

  const rows = all.map(toRow);
  const open = rows.filter((r) => r.status === "open");
  return {
    rows: tab === "closed" ? rows.filter((r) => r.status === "closed") : tab === "unread" ? open.filter((r) => r.unread > 0) : open,
    counts: {
      open: open.length,
      unread: open.filter((r) => r.unread > 0).length,
      closed: rows.length - open.length,
    },
  };
}
