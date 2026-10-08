"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { saveProviderProfile } from "@/app/(fr)/dashboard/profil/actions";
import { getDashboardTexts } from "@/i18n/dashboard";
import type { Locale } from "@/i18n/dictionaries";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]";

export function ProfileForm({
  defaults,
  publicPath,
  locale = "fr",
}: {
  defaults: { headline: string; bio: string; city: string; contentLocale: string };
  publicPath: string;
  locale?: Locale;
}) {
  const t = getDashboardTexts(locale);
  const p = t.profile;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const result = await saveProviderProfile(new FormData(e.currentTarget));
    setPending(false);
    if ("error" in result && result.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="headline" className="text-sm font-medium">{p.headline}</label>
        <input id="headline" name="headline" maxLength={120} defaultValue={defaults.headline} placeholder={p.headlinePlaceholder} className={inputClass} />
      </div>
      <div>
        <label htmlFor="bio" className="text-sm font-medium">{p.bio}</label>
        <textarea id="bio" name="bio" maxLength={2000} rows={6} defaultValue={defaults.bio} placeholder={p.bioPlaceholder} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="city" className="text-sm font-medium">{p.city}</label>
          <input id="city" name="city" maxLength={80} defaultValue={defaults.city} className={inputClass} />
        </div>
        <div>
          <label htmlFor="contentLocale" className="text-sm font-medium">{p.language}</label>
          <select id="contentLocale" name="contentLocale" defaultValue={defaults.contentLocale} className={inputClass}>
            <option value="fr">{p.french}</option>
            <option value="en">{p.english}</option>
          </select>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {saved && (
        <p role="status" className="rounded-xl bg-[var(--color-brand-50)] px-4 py-3 text-sm text-[var(--color-brand-700)]">
          {p.saved} <Link href={publicPath} className="underline">{p.viewPublic}</Link>
        </p>
      )}

      <button type="submit" disabled={pending} className="rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? t.common.saving : t.common.save}
      </button>
    </form>
  );
}
