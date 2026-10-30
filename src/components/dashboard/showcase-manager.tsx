"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPortfolioItem, removePortfolioItem, saveBusiness } from "@/app/(fr)/dashboard/vitrine/actions";
import type { ShowcaseTexts } from "@/i18n/showcase";

export type PortfolioRow = { id: string; kind: string; title: string; description: string | null; url: string };

/** Gestion de la vitrine : statut (particulier ou entreprise) et réalisations. */
export function ShowcaseManager({
  texts,
  businessType,
  companyName,
  items,
  limit,
}: {
  texts: ShowcaseTexts;
  businessType: "individual" | "company";
  companyName: string;
  items: PortfolioRow[];
  limit: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"individual" | "company">(businessType);
  const [company, setCompany] = useState(companyName);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ kind: "video", title: "", description: "", url: "" });

  function saveStatus(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveBusiness({ businessType: status, companyName: company });
      if ("error" in result) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addPortfolioItem(form);
      if ("error" in result) setError(result.error);
      else {
        setForm({ kind: "video", title: "", description: "", url: "" });
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await removePortfolioItem(id);
      if ("error" in result) setError(result.error);
      else router.refresh();
    });
  }

  const kindLabel: Record<string, string> = { video: texts.kindVideo, work: texts.kindWork, link: texts.kindLink };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-display text-base font-bold">{texts.statusTitle}</h2>
          <p className="mt-1 text-sm text-[var(--subtle)]">{texts.statusHelp}</p>
          <form onSubmit={saveStatus} className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["individual", "company"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    status === value
                      ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                      : "border-[var(--border)] text-[var(--subtle)] hover:border-[var(--color-brand-300)]"
                  }`}
                >
                  {value === "individual" ? texts.statusIndividual : texts.statusCompany}
                </button>
              ))}
            </div>
            {status === "company" && (
              <label className="block text-xs font-semibold">
                {texts.companyName}
                <input className="input mt-1 w-full" maxLength={120} value={company} onChange={(e) => setCompany(e.target.value)} />
              </label>
            )}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={pending} className="btn-primary btn-sm">
                {pending ? texts.saving : texts.save}
              </button>
              {saved && <span className="text-xs font-semibold text-emerald-600">{texts.saved}</span>}
            </div>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-base font-bold">{texts.worksTitle}</h2>
          {items.length === 0 && <p className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--subtle)]">{texts.empty}</p>}
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <span className="rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-brand-700)]">
                  {kindLabel[item.kind] ?? item.kind}
                </span>
                <p className="mt-1 truncate font-semibold">{item.title}</p>
                <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="truncate text-xs text-[var(--color-brand-600)] underline-offset-2 hover:underline">
                  {item.url}
                </a>
              </div>
              <button type="button" disabled={pending} onClick={() => remove(item.id)} className="btn-ghost btn-sm self-start text-[var(--tone-danger-fg)] sm:self-center">
                {texts.remove}
              </button>
            </div>
          ))}
        </section>
      </div>

      <aside className="h-fit rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-base font-bold">{texts.add}</h2>
        {items.length >= limit ? (
          <p className="mt-3 text-sm text-[var(--subtle)]">{texts.limit(limit)}</p>
        ) : (
          <form onSubmit={addItem} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold">
              Type
              <select className="input mt-1 w-full" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                <option value="video">{texts.kindVideo}</option>
                <option value="work">{texts.kindWork}</option>
                <option value="link">{texts.kindLink}</option>
              </select>
            </label>
            <label className="block text-xs font-semibold">
              {texts.fieldTitle}
              <input className="input mt-1 w-full" maxLength={80} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="block text-xs font-semibold">
              {texts.fieldUrl}
              <input className="input mt-1 w-full" type="url" required placeholder="https://" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </label>
            <label className="block text-xs font-semibold">
              {texts.fieldDescription}
              <textarea className="input mt-1 w-full" maxLength={300} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            {error && <p role="alert" className="notice notice-danger">{error}</p>}
            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? texts.adding : texts.add}
            </button>
          </form>
        )}
        {error && items.length >= limit && <p role="alert" className="notice notice-danger mt-3">{error}</p>}
      </aside>
    </div>
  );
}
