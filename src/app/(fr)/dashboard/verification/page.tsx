import type { Metadata } from "next";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { KycForm } from "@/components/dashboard/kyc-form";
import { Notice, Pill, Section, kycTone } from "@/components/dashboard/pro";
import { DOCUMENT_TYPES } from "@/lib/kyc";
import { getKycTexts } from "@/i18n/kyc";
import { getDashboardTexts } from "@/i18n/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getPublicPageTexts(await visitorLocale()).titles.verification };
}
export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getKycTexts(locale);
  const nav = getDashboardTexts(locale).nav;
  const supabase = await createClient();

  const { data: verif } = await supabase
    .from("verifications")
    .select("id, status, document_type, document_country, rejection_reason, created_at, reviewed_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const statusNow = user.verificationStatus;
  const docLabel = verif?.document_type
    ? t.docTypes[verif.document_type] ?? DOCUMENT_TYPES.find((d) => d.value === verif.document_type)?.label ?? verif.document_type
    : null;
  const dateLocale = locale === "en" ? "en-GB" : "fr-FR";

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      navSections={dashboardNavSections(nav, user.role, "/dashboard/verification")}
    >
      <div className="mx-auto max-w-2xl">
        {statusNow === "verified" ? (
          <div className="mb-8">
            <Notice
              tone="success"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              }
              title={t.verified.title}
            >
              {t.verified.body}
            </Notice>
          </div>
        ) : verif && ["pending", "manual_review"].includes(verif.status) ? (
          <div className="mb-8">
            <Notice tone="warning" title={t.pendingBody}>
              <span className="flex flex-wrap items-center gap-3">
                <Pill tone={kycTone(verif.status)}>{t.statusLabels[verif.status]}</Pill>
                <span>
                  {t.submittedOn}{" "}
                  {new Date(verif.created_at).toLocaleDateString(dateLocale, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </span>
              {docLabel && (
                <span className="mt-2 block text-xs opacity-90">
                  {t.documentSubmitted} <strong>{docLabel}</strong> ({verif.document_country})
                </span>
              )}
            </Notice>
          </div>
        ) : verif?.status === "rejected" ? (
          <div className="mb-8">
            <Notice tone="danger" title={t.rejected.title}>
              {verif.rejection_reason && (
                <p>
                  {t.rejected.reason} {verif.rejection_reason}
                </p>
              )}
              <p className="mt-1">{t.rejected.retry}</p>
            </Notice>
          </div>
        ) : null}

        {statusNow !== "verified" && !["pending", "manual_review"].includes(verif?.status ?? "") && (
          <>
            <Section title={t.formTitle} subtitle={t.formIntro} className="mb-8">
              <div className="mt-2 grid gap-4 sm:grid-cols-3">
                {t.steps.map((s, i) => (
                  <div key={s.title} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-bold text-[var(--color-brand-700)]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--subtle)]">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <KycForm defaultFirstName={user.firstName} defaultLastName={user.lastName} locale={locale} />
          </>
        )}

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-sm text-[var(--subtle)] underline underline-offset-4 hover:text-[var(--foreground)]">
            {t.backToDashboard}
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
