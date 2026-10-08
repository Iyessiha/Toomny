import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { getAccountTexts } from "@/i18n/account";
import { visitorLocale } from "@/i18n/server-locale";
import { deleteMyAccount } from "./actions";

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
  const { error } = await searchParams;
  const errorText =
    error === "active" ? t.errors.active : error === "email" ? t.errors.email : error === "failed" ? t.errors.failed : null;

  return (
    <DashboardShell user={user} locale={locale} title={t.title} subtitle={t.subtitle} nav={[]}>
      {errorText && (
        <p role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {errorText}
        </p>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
        <h2 className="font-display text-base font-bold">{t.exportTitle}</h2>
        <p className="mt-2 text-sm text-[var(--subtle)]">{t.exportBody}</p>
        <a
          href="/api/account/export"
          download
          className="mt-5 inline-flex rounded-full border border-[var(--border)] px-5 py-2 text-sm font-semibold hover:bg-[var(--surface)]"
        >
          {t.exportButton}
        </a>
      </section>

      <section className="mt-6 rounded-2xl border border-red-200 bg-[var(--background)] p-6">
        <h2 className="font-display text-base font-bold text-red-800">{t.deleteTitle}</h2>
        <p className="mt-2 text-sm text-[var(--subtle)]">{t.deleteBody}</p>
        <form action={deleteMyAccount} className="mt-5 flex flex-col gap-3 sm:max-w-md">
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
            className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm"
          />
          <button type="submit" className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600">
            {t.deleteButton}
          </button>
        </form>
      </section>
    </DashboardShell>
  );
}
