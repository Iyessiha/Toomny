import type { Metadata } from "next";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { KycForm } from "@/components/dashboard/kyc-form";
import { VERIFICATION_STATUS_TONE, DOCUMENT_TYPES } from "@/lib/kyc";
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
      nav={[
        { href: "/dashboard", label: nav.overview },
        { href: "/dashboard/verification", label: nav.kyc, current: true },
      ]}
    >
      <div className="mx-auto max-w-2xl">
        {statusNow === "verified" ? (
          <div className="mb-8 flex items-start gap-4 rounded-2xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
              <svg className="h-5 w-5 text-[var(--color-brand-600)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="font-display font-bold text-[var(--color-brand-800)]">{t.verified.title}</p>
              <p className="mt-1 text-sm text-[var(--color-brand-700)]">{t.verified.body}</p>
            </div>
          </div>
        ) : verif && ["pending", "manual_review"].includes(verif.status) ? (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${VERIFICATION_STATUS_TONE[verif.status]}`}>
                {t.statusLabels[verif.status]}
              </span>
              <span className="text-sm text-amber-800">
                {t.submittedOn} {new Date(verif.created_at).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <p className="mt-3 text-sm text-amber-800">{t.pendingBody}</p>
            {docLabel && (
              <p className="mt-2 text-xs text-amber-700">
                {t.documentSubmitted} <strong>{docLabel}</strong> ({verif.document_country})
              </p>
            )}
          </div>
        ) : verif?.status === "rejected" ? (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-display font-bold text-red-800">{t.rejected.title}</p>
            {verif.rejection_reason && <p className="mt-2 text-sm text-red-700">{t.rejected.reason} {verif.rejection_reason}</p>}
            <p className="mt-3 text-sm text-red-700">{t.rejected.retry}</p>
          </div>
        ) : null}

        {statusNow !== "verified" && !["pending", "manual_review"].includes(verif?.status ?? "") && (
          <>
            <div className="mb-8">
              <h2 className="font-display text-lg font-bold">{t.formTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{t.formIntro}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
            </div>

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
