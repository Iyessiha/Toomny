"use client";

import { useState, type FormEvent } from "react";
import { createSupportThread } from "@/app/(fr)/messages/support-actions";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import type { Locale } from "@/i18n/dictionaries";

export function NewThreadForm({ locale }: { locale: Locale }) {
  const ts = getMarketplaceTexts(locale).messages.support;
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const subject = (form.elements.namedItem("subject") as HTMLInputElement)?.value ?? "";
    setPending(true);
    await createSupportThread(subject);
    // createSupportThread redirige — ce code n'est pas atteint en cas de succès
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6">
      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium">
          {ts.subjectLabel}
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          maxLength={200}
          placeholder={ts.subjectPlaceholder}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[var(--color-brand-500)] py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-brand-600)] active:scale-95 disabled:opacity-60"
      >
        {pending ? ts.sending : ts.newThread}
      </button>
    </form>
  );
}
