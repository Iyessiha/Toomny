import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { Avatar, Pill } from "@/components/dashboard/pro";
import { InquiryReplyForm } from "@/components/inquiries/reply-form";
import { MarkConversationReadButton } from "@/components/inquiries/mark-read-button";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { groupInquiries } from "@/lib/inquiries";
import { resolveDisplayNames } from "@/lib/names";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const user = await requireAuth();
  return { title: getMarketplaceTexts(user.preferredLocale).inquiries.metaTitle };
}

export default async function DemandesPage() {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getMarketplaceTexts(locale).inquiries;
  const nav = getDashboardTexts(locale).nav;
  const supabase = await createClient();

  // RLS : seules mes demandes (envoyées ou reçues) sont lisibles.
  const { data: rows } = await supabase
    .from("inquiries")
    .select("id, from_id, to_id, service_id, message, read_at, created_at")
    .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  const conversations = groupInquiries(rows ?? [], user.id);

  const otherIds = [...new Set(conversations.map((c) => c.otherId))];
  const serviceIds = [
    ...new Set(conversations.map((c) => c.serviceId).filter((s): s is string => !!s)),
  ];

  const [names, { data: providerRows }, { data: serviceRows }] = await Promise.all([
    resolveDisplayNames(otherIds),
    otherIds.length
      ? supabase.from("provider_directory").select("id").in("id", otherIds)
      : Promise.resolve({ data: [] }),
    serviceIds.length
      ? supabase.from("services").select("id, title").in("id", serviceIds)
      : Promise.resolve({ data: [] }),
  ]);
  const providerIds = new Set((providerRows ?? []).map((p) => p.id as string));
  const serviceTitles = new Map((serviceRows ?? []).map((s) => [s.id as string, s.title as string]));

  const dateTag = locale === "en" ? "en-GB" : "fr-FR";

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/dashboard", label: nav.overview },
        { href: "/orders", label: nav.orders },
        { href: "/messages", label: nav.messages },
        { href: "/demandes", label: t.title, current: true },
        { href: "/disputes", label: getMarketplaceTexts(locale).disputes.title },
      ]}
    >
      {conversations.length === 0 ? (
        <EmptyState title={t.empty} body={t.emptyBody} />
      ) : (
        <ul className="space-y-5">
          {conversations.map((c) => {
            const person = names.get(c.otherId);
            const serviceTitle = c.serviceId ? serviceTitles.get(c.serviceId) : undefined;
            return (
              <li key={c.key} className="card card-pad">
                {/* En-tête : interlocuteur + prestation */}
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar name={person?.name ?? person?.initials} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{person?.name ?? "—"}</p>
                    <p className="truncate text-xs text-[var(--subtle)]">
                      {serviceTitle ? (
                        <>
                          {t.aboutService}{" "}
                          <Link
                            href={`/services/${c.serviceId}`}
                            className="text-[var(--color-brand-600)] underline-offset-2 hover:underline"
                          >
                            {serviceTitle}
                          </Link>
                        </>
                      ) : (
                        t.directContact
                      )}
                    </p>
                  </div>
                  {providerIds.has(c.otherId) && (
                    <Link href={`/prestataires/${c.otherId}`} className="btn-ghost btn-sm">
                      {t.viewProfile}
                    </Link>
                  )}
                  <MarkConversationReadButton
                    otherId={c.otherId}
                    serviceId={c.serviceId}
                    unread={c.unread}
                    locale={locale}
                  />
                </div>

                {/* Fil */}
                <ul className="app-stagger mt-4 space-y-2.5">
                  {c.messages.map((m) => {
                    const mine = m.from_id === user.id;
                    return (
                      <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] ${mine ? "text-right" : "text-left"}`}>
                          <p
                            className={`inline-block whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                              mine
                                ? "rounded-br-md bg-[var(--color-brand-500)] text-white"
                                : "rounded-bl-md bg-[var(--surface)]"
                            }`}
                          >
                            {m.message}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--subtle)]">
                            {new Date(m.created_at).toLocaleString(dateTag, {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {mine && (
                              <>
                                {" · "}
                                {m.read_at
                                  ? `${t.readOn} ${new Date(m.read_at).toLocaleDateString(dateTag, { day: "numeric", month: "short" })}`
                                  : t.sentState}
                              </>
                            )}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Réponse */}
                <div className="mt-4 border-t border-[var(--border)] pt-4">
                  <InquiryReplyForm toId={c.otherId} serviceId={c.serviceId} locale={locale} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}
