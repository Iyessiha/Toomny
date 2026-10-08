"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createService } from "@/app/(fr)/dashboard/prestations/actions";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)]";

export function ServiceForm({ categories }: { categories: { id: string; name: string }[] }) {
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
        <label htmlFor="title" className="text-sm font-medium">Titre</label>
        <input id="title" name="title" required maxLength={120} placeholder="Création de logo en 3 concepts" className={inputClass} />
      </div>
      <div>
        <label htmlFor="categoryId" className="text-sm font-medium">Catégorie</label>
        <select id="categoryId" name="categoryId" required defaultValue="" className={inputClass}>
          <option value="" disabled>Choisir…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <textarea id="description" name="description" required minLength={30} maxLength={3000} rows={5} placeholder="Ce que vous livrez, comment vous travaillez, ce dont vous avez besoin du client." className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="price" className="text-sm font-medium">Prix (FCFA)</label>
          <input id="price" name="price" required inputMode="numeric" pattern="[0-9 ]+" placeholder="25000" className={inputClass} />
        </div>
        <div>
          <label htmlFor="deliveryDays" className="text-sm font-medium">Délai (jours)</label>
          <input id="deliveryDays" name="deliveryDays" type="number" min={1} max={365} required className={inputClass} />
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {done && <p role="status" className="rounded-xl bg-[var(--color-brand-50)] px-4 py-3 text-sm text-[var(--color-brand-700)]">Brouillon enregistré. Il sera publié après validation.</p>}

      <button type="submit" disabled={pending} className="w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Enregistrement…" : "Enregistrer le brouillon"}
      </button>
    </form>
  );
}
