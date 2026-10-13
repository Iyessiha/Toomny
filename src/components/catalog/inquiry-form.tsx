"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { sendInquiry } from "@/app/(fr)/services/[id]/contact/actions";
import { getCatalogTexts } from "@/i18n/catalog";
import type { Locale } from "@/i18n/dictionaries";

export function InquiryForm({
  serviceId,
  locale = "fr",
  backHref,
}: {
  serviceId: string;
  locale?: Locale;
  backHref: string;
}) {
  const t = getCatalogTexts(locale);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [chars, setChars] = useState(0);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await sendInquiry(serviceId, new FormData(e.currentTarget));
    setPending(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="mt-6 space-y-5">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--color-brand-50)] px-6 py-8 text-center">
          <span className="text-4xl" aria-hidden>✅</span>
          <p className="font-semibold text-[var(--color-brand-700)]">{t.contactDone}</p>
        </div>
        <Link
          href={backHref}
          className="flex items-center justify-center rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)]"
        >
          ← {t.contactBack}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <div className="flex items-end justify-between mb-1.5">
          <label htmlFor="inquiry-message" className="text-sm font-medium">
            {locale === "fr" ? "Votre message" : "Your message"}
          </label>
          <span className={`text-xs ${chars > 900 ? "text-[var(--crit,#dc2626)]" : "text-[var(--subtle)]"}`}>
            {chars} / 1 000
          </span>
        </div>
        <textarea
          id="inquiry-message"
          name="message"
          required
          minLength={10}
          maxLength={1000}
          rows={6}
          placeholder={t.contactPlaceholder}
          onChange={(e) => setChars(e.target.value.length)}
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-600)] disabled:opacity-60"
        >
          {pending ? t.contactSending : t.contactSend}
        </button>
        <Link
          href={backHref}
          className="flex items-center justify-center rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)]"
        >
          {t.contactBack}
        </Link>
      </div>
    </form>
  );
}
