"use client";

import { useState, type FormEvent } from "react";
import { changeEmail, changePassword } from "@/app/(fr)/dashboard/compte/actions";
import { getAccountTexts } from "@/i18n/account";
import type { Locale } from "@/i18n/dictionaries";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]";

const copy: Record<Locale, { labelColon: string }> = {
  fr: { labelColon: " :" },
  en: { labelColon: ":" },
};

export function AccountEmailForm({
  currentEmail,
  locale = "fr",
}: {
  currentEmail: string;
  locale?: Locale;
}) {
  const t = getAccountTexts(locale);
  const c = copy[locale];
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setDone(false);
    const result = await changeEmail(new FormData(e.currentTarget));
    setPending(false);
    if ("error" in result && result.error) setError(result.error);
    else setDone(true);
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
      <h2 className="font-display text-base font-bold">{t.emailTitle}</h2>
      <p className="mt-1 text-xs text-[var(--subtle)]">
        {t.emailCurrent}{c.labelColon} <span className="font-medium text-[var(--foreground)]">{currentEmail}</span>
      </p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="newEmail" className="text-sm font-medium">{t.emailNew}</label>
          <input
            id="newEmail"
            name="newEmail"
            type="email"
            required
            placeholder={t.emailNewPlaceholder}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="emailCurrentPassword" className="text-sm font-medium">{t.passwordCurrent}</label>
          <input
            id="emailCurrentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
        {error && <p role="alert" className="notice notice-danger">{error}</p>}
        {done && <p role="status" className="rounded-xl bg-[var(--color-brand-50)] px-4 py-3 text-sm text-[var(--color-brand-700)]">{t.emailSent}</p>}
        <button
          type="submit"
          disabled={pending || done}
          className="rounded-full bg-[var(--color-brand-500)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? t.emailUpdating : t.emailButton}
        </button>
      </form>
    </section>
  );
}

export function AccountPasswordForm({ locale = "fr" }: { locale?: Locale }) {
  const t = getAccountTexts(locale);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setDone(false);
    const result = await changePassword(new FormData(e.currentTarget));
    setPending(false);
    if ("error" in result && result.error) setError(result.error);
    else {
      setDone(true);
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
      <h2 className="font-display text-base font-bold">{t.passwordTitle}</h2>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="currentPassword" className="text-sm font-medium">{t.passwordCurrent}</label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="text-sm font-medium">{t.passwordNew}</label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="text-sm font-medium">{t.passwordConfirm}</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        {error && <p role="alert" className="notice notice-danger">{error}</p>}
        {done && <p role="status" className="rounded-xl bg-[var(--color-brand-50)] px-4 py-3 text-sm text-[var(--color-brand-700)]">{t.passwordDone}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--color-brand-500)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? t.passwordUpdating : t.passwordButton}
        </button>
      </form>
    </section>
  );
}
