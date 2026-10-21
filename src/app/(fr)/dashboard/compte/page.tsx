import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { getDashboardTexts } from "@/i18n/dashboard";
import { Notice, Section } from "@/components/dashboard/pro";
import { getAccountTexts } from "@/i18n/account";
import { visitorLocale } from "@/i18n/server-locale";
import { deleteMyAccount } from "./actions";
import { AccountEmailForm, AccountPasswordForm } from "@/components/dashboard/account-forms";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAccountTexts(await visitorLocale()).title };
}
export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getAccountTexts(locale);
  const nav = getDashboardTexts(locale).nav;
  const { error } = await searchParams;
  const errorText =
    error === "active" ? t.errors.active : error === "email" ? t.errors.email : error === "failed" ? t.errors.failed : null;

  return (
    <DashboardShell
      user={user}
      bell={<NotificationBell locale={locale} />}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      navSections={dashboardNavSections(nav, user.role, "/dashboard/compte")}
    >
      {errorText && (
        <div className="mb-6">
          <Notice tone="danger">{errorText}</Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <AccountEmailForm currentEmail={user.email ?? ""} locale={locale} />
        <AccountPasswordForm locale={locale} />
      </div>

      <div className="mt-6">
        <Section title={t.exportTitle} subtitle={t.exportBody}>
          <a href="/api/account/export" download className="btn-secondary">
            {t.exportButton}
          </a>
        </Section>
      </div>

      <div className="mt-6">
        <Section
          title={t.deleteTitle}
          subtitle={t.deleteBody}
          className="border-[var(--tone-danger-fg)]/30"
        >
          <form action={deleteMyAccount} className="flex flex-col gap-3 sm:max-w-md">
            <label className="text-sm font-medium" htmlFor="confirmEmail">
              {t.deleteLabel}
            </label>
            <input
              id="confirmEmail"
              name="confirmEmail"
              type="email"
              required
              autoComplete="off"
              placeholder={user.email ?? ""}
              className="input"
            />
            <button type="submit" className="btn-danger">
              {t.deleteButton}
            </button>
          </form>
        </Section>
      </div>
    </DashboardShell>
  );
}
