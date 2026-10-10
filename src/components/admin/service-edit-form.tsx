"use client";

import { useState, type FormEvent } from "react";
import { editService } from "@/app/(fr)/admin/services/actions";
import { getAdminTexts } from "@/i18n/admin";
import type { Locale } from "@/i18n/dictionaries";

type Props = {
  service: {
    id: string;
    title: string;
    description: string;
    price_minor: number;
    delivery_days: number;
    status: string;
    category_id: string;
  };
  categories: { id: string; name: string }[];
  locale: Locale;
};

const STATUSES = ["draft", "active", "paused", "removed"] as const;

export function ServiceEditForm({ service, categories, locale }: Props) {
  const t = getAdminTexts(locale).serviceEditPage;
  const tStatuses = getAdminTexts(locale).servicesPage.status;
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const result = await editService(fd);
    if (result.error) {
      setMsg({ ok: false, text: t.errorSave + " — " + result.error });
    } else {
      setMsg({ ok: true, text: t.saved });
    }
    setPending(false);
  }

  const inputCls = "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]";
  const labelCls = "block text-sm font-medium mb-1";

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
      <input type="hidden" name="serviceId" value={service.id} />

      <div>
        <label className={labelCls}>{t.fieldTitle}</label>
        <input name="title" defaultValue={service.title} required className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>{t.fieldDescription}</label>
        <textarea name="description" defaultValue={service.description} rows={6} className={inputCls} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t.fieldPrice}</label>
          <input type="number" name="price_minor" defaultValue={service.price_minor} min={1} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t.fieldDelivery}</label>
          <input type="number" name="delivery_days" defaultValue={service.delivery_days} min={1} required className={inputCls} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t.fieldCategory}</label>
          <select name="category_id" defaultValue={service.category_id} className={inputCls}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t.fieldStatus}</label>
          <select name="status" defaultValue={service.status} className={inputCls}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{tStatuses[s] ?? s}</option>
            ))}
          </select>
        </div>
      </div>

      {msg && (
        <p role="alert" className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? t.saving : t.save}
      </button>
    </form>
  );
}
