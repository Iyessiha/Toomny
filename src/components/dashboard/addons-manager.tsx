"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createServiceAddon, deleteServiceAddon, setServiceAddonActive } from "@/app/(fr)/dashboard/prestations/[id]/supplements/actions";
import { formatMoney } from "@/lib/money";
import type { AddonTexts } from "@/i18n/addons";

export type ManagedAddon = {
  id: string;
  title: string;
  description: string | null;
  price_minor: number;
  currency: string;
  extra_delivery_days: number;
  active: boolean;
};

/** Gestion des suppléments d'une prestation : liste, ajout, masquage et suppression. */
export function AddonsManager({
  serviceId,
  addons,
  texts,
  limit,
}: {
  serviceId: string;
  addons: ManagedAddon[];
  texts: AddonTexts;
  limit: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ title: "", description: "", priceRaw: "", extraDays: "0" });
  const atLimit = addons.length >= limit;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createServiceAddon(serviceId, {
        title: form.title,
        description: form.description,
        priceRaw: form.priceRaw,
        extraDays: Number(form.extraDays),
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setForm({ title: "", description: "", priceRaw: "", extraDays: "0" });
      router.refresh();
    });
  }

  function toggle(addon: ManagedAddon) {
    setError(null);
    startTransition(async () => {
      const result = await setServiceAddonActive(addon.id, !addon.active);
      if ("error" in result) setError(result.error);
      else router.refresh();
    });
  }

  function remove(addon: ManagedAddon) {
    if (!window.confirm(`${texts.remove} : ${addon.title} ?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteServiceAddon(addon.id);
      if ("error" in result) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section className="space-y-3">
        {addons.length === 0 && <p className="text-sm text-[var(--subtle)]">{texts.empty}</p>}
        {addons.map((addon) => (
          <div
            key={addon.id}
            className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{addon.title}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    addon.active ? "bg-emerald-100 text-emerald-700" : "bg-[var(--border)] text-[var(--subtle)]"
                  }`}
                >
                  {addon.active ? texts.active : texts.inactive}
                </span>
              </div>
              {addon.description && <p className="mt-0.5 text-xs text-[var(--subtle)]">{addon.description}</p>}
              <p className="mt-1 text-sm">
                <span className="font-display font-bold text-[var(--color-brand-600)]">
                  +{formatMoney(BigInt(addon.price_minor), addon.currency, "fr")}
                </span>
                {addon.extra_delivery_days > 0 && (
                  <span className="ml-3 text-[var(--subtle)]">+{addon.extra_delivery_days} j</span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" disabled={pending} onClick={() => toggle(addon)} className="btn-ghost btn-sm">
                {addon.active ? texts.deactivate : texts.activate}
              </button>
              <button type="button" disabled={pending} onClick={() => remove(addon)} className="btn-ghost btn-sm text-[var(--tone-danger-fg)]">
                {texts.remove}
              </button>
            </div>
          </div>
        ))}
      </section>

      <aside className="h-fit rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-base font-bold">{texts.addTitle}</h2>
        {atLimit ? (
          <p className="mt-3 text-sm text-[var(--subtle)]">{texts.limit(limit)}</p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold">
              {texts.fieldTitle}
              <input className="input mt-1 w-full" maxLength={80} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="block text-xs font-semibold">
              {texts.fieldDescription}
              <textarea className="input mt-1 w-full" maxLength={300} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label className="block text-xs font-semibold">
              {texts.fieldPrice}
              <input className="input mt-1 w-full" inputMode="numeric" required value={form.priceRaw} onChange={(e) => setForm({ ...form, priceRaw: e.target.value })} />
            </label>
            <label className="block text-xs font-semibold">
              {texts.fieldDays}
              <input className="input mt-1 w-full" type="number" min={0} max={60} value={form.extraDays} onChange={(e) => setForm({ ...form, extraDays: e.target.value })} />
            </label>
            {error && <p role="alert" className="notice notice-danger">{error}</p>}
            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? texts.saving : texts.submit}
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
