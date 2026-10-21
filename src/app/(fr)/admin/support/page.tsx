import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { EmptyState } from "@/components/dashboard/shell";
import { Pill, Section, TableCard } from "@/components/dashboard/pro";
import { formatSubmittedAt } from "@/i18n/auth";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { closeSupportRequest } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).nav.support };
}
export const dynamic = "force-dynamic";

const copy = {
  fr: {
    title: "Demandes de contact",
    subtitle: "Messages envoyés par les prestataires et clients depuis « Contacter Toomny ».",
    open: "En cours",
    closed: "Traitée",
    close: "Marquer traitée",
    emptyTitle: "Aucune demande",
    emptyBody: "Les demandes de contact apparaîtront ici.",
    colFrom: "De",
    colSubject: "Sujet",
    colMessage: "Message",
    colDate: "Reçue le",
    colStatus: "Statut",
  },
  en: {
    title: "Contact requests",
    subtitle: "Messages sent by providers and clients from “Contact Toomny”.",
    open: "Open",
    closed: "Closed",
    close: "Mark as closed",
    emptyTitle: "No requests",
    emptyBody: "Contact requests will appear here.",
    colFrom: "From",
    colSubject: "Subject",
    colMessage: "Message",
    colDate: "Received on",
    colStatus: "Status",
  },
} as const;

export default async function AdminSupportPage() {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = copy[locale];

  const db = createAdminClient();
  const { data: rows } = await db
    .from("support_requests")
    .select("id, subject, body, status, created_at, profile:profiles(display_name, email, role)")
    .order("created_at", { ascending: false })
    .limit(100);

  const list = (rows ?? []).map((r) => {
    const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile;
    return { ...r, profile };
  });

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={t.subtitle}
      nav={getAdminNavGroups(locale, "/admin/support")}
    >
      {list.length === 0 ? (
        <Section title={t.emptyTitle}>
          <EmptyState title={t.emptyTitle} body={t.emptyBody} />
        </Section>
      ) : (
        <TableCard>
          <thead>
            <tr>
              <th>{t.colFrom}</th>
              <th>{t.colSubject}</th>
              <th>{t.colDate}</th>
              <th>{t.colStatus}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-normal!">
                  <span className="block font-semibold">{r.profile?.display_name ?? "—"}</span>
                  <span className="block text-xs text-[var(--subtle)]">{r.profile?.email}</span>
                </td>
                <td className="whitespace-normal!">
                  <span className="block font-semibold">{r.subject}</span>
                  <span className="mt-1 block whitespace-pre-line text-sm text-[var(--subtle)]">{r.body}</span>
                </td>
                <td className="text-xs text-[var(--subtle)]">{formatSubmittedAt(r.created_at, locale)}</td>
                <td>
                  <Pill tone={r.status === "closed" ? "neutral" : "warning"}>
                    {r.status === "closed" ? t.closed : t.open}
                  </Pill>
                </td>
                <td className="text-right">
                  {r.status !== "closed" && (
                    <form action={closeSupportRequest}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <button type="submit" className="btn-ghost btn-sm">{t.close}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </AdminShell>
  );
}
