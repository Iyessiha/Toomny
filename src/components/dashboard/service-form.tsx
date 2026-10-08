"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createService } from "@/app/(fr)/dashboard/prestations/actions";
import { getDashboardTexts } from "@/i18n/dashboard";
import type { Locale } from "@/i18n/dictionaries";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)]";

export function ServiceForm({ categories, locale = "fr" }: { categories: { id: string; name: string }[]; locale?: Locale }) {
  const t = getDashboardTexts(locale).services;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setDone(false);
    const result = await createService(new FormData(e.currentTarget));
    setPending(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
    setDone(true);
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="text-sm font-medium">{t.form.title}</label>
        <input id="title" name="title" required maxLength={120} placeholder={t.form.titlePlaceholder} className={inputClass} />
      </div>
      <div>
        <label htmlFor="categoryId" className="text-sm font-medium">{t.form.category}</label>
        <select id="categoryId" name="categoryId" required defaultValue="" className={inputClass}>
          <option value="" disabled>{t.form.choose}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="description" className="text-sm font-medium">{t.form.description}</label>
        <textarea id="description" name="description" required minLength={30} maxLength={3000} rows={5} placeholder={t.form.descriptionPlaceholder} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="price" className="text-sm font-medium">{t.form.price}</label>
          <input id="price" name="price" required inputMode="numeric" pattern="[0-9 ]+" placeholder="25000" className={inputClass} />
        </div>
        <div>
          <label htmlFor="deliveryDays" className="text-sm font-medium">{t.form.delivery}</label>
          <input id="deliveryDays" name="deliveryDays" type="number" min={1} max={365} required className={inputClass} />
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {done && <p role="status" className="rounded-xl bg-[var(--color-brand-50)] px-4 py-3 text-sm text-[var(--color-brand-700)]">{t.draftSaved}</p>}

      <button type="submit" disabled={pending} className="w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? t.creating : t.saveDraft}
      </button>
    </form>
  );
}
