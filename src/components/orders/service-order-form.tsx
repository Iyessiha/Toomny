"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/(fr)/orders/actions";

export function ServiceOrderForm({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const requirements = String(new FormData(e.currentTarget).get("requirements") ?? "");
    setPending(true);
    setError(null);
    const result = await createOrder({ serviceId, requirements });
    if ("error" in result) {
      setPending(false);
      setError(result.error);
      return;
    }
    router.push(`/orders/${result.orderId}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor="requirements" className="text-sm font-medium">Votre besoin</label>
      <textarea
        id="requirements"
        name="requirements"
        required
        minLength={10}
        maxLength={2000}
        rows={5}
        placeholder="Objectif, contraintes, supports fournis, délai souhaité…"
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]"
      />
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Création…" : "Commander"}
      </button>
      <p className="text-xs text-[var(--subtle)]">Aucun paiement n&apos;est prélevé à cette étape : la commande attend la confirmation du paiement.</p>
    </form>
  );
}
