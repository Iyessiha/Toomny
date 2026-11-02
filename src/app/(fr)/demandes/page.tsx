import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { Avatar, Pill } from "@/components/dashboard/pro";
import { InquiryReplyForm } from "@/components/inquiries/reply-form";
import { InquiryThread } from "@/components/inquiries/inquiry-thread";
import { MarkConversationReadButton } from "@/components/inquiries/mark-read-button";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { groupInquiries } from "@/lib/inquiries";
import { hasAiAccess } from "@/lib/provider-assist";
import { isProvider } from "@/lib/auth";
import { resolveDisplayNames } from "@/lib/names";
import { NotificationBell } from "@/components/dashboard/notification-bell";

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
    .select("id, from_id, to_id, service_id, message, read_at, created_at, edited_at")
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

  // Brouillon IA : prestataires ayant un plan payant actif uniquement.
  let aiAvailable = false;
  if (isProvider(user.role)) {
    const { data: plan } = await supabase
      .from("provider_profiles")
      .select("plan, plan_expires_at")
      .eq("profile_id", user.id)
      .maybeSingle();
    aiAvailable = hasAiAccess(plan?.plan, plan?.plan_expires_at ?? null);
  }

  return (
    <DashboardShell
      user={user}
      bell={<NotificationBell locale={locale} />}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      navSections={dashboardNavSections(nav, user.role, "/demandes")}
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

                {/* Fil de discussion + réponse */}
                <div className="mt-4">
                  <InquiryThread
                    locale={locale}
                    messages={c.messages.map((m) => ({
                      id: m.id,
                      mine: m.from_id === user.id,
                      message: m.message,
                      createdAt: m.created_at,
                      readAt: m.read_at,
                      editedAt: m.edited_at ?? null,
                    }))}
                    footer={
                      <div className="border-t border-[var(--border)] pt-4">
                        <InquiryReplyForm toId={c.otherId} serviceId={c.serviceId} locale={locale} aiAvailable={aiAvailable} />
                      </div>
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}
