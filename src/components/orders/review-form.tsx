"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "@/app/(fr)/orders/actions";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import type { Locale } from "@/i18n/dictionaries";

export function ReviewForm({ orderId, locale = "fr" }: { orderId: string; locale?: Locale }) {
  const t = getMarketplaceTexts(locale).review;
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const comment = String(new FormData(e.currentTarget).get("comment") ?? "");
    setPending(true);
    setError(null);
    const result = await submitReview({ orderId, rating, comment });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <fieldset>
        <legend className="text-sm font-medium">{t.rating}</legend>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              className={`h-10 w-10 rounded-full border text-sm font-semibold ${
                rating === n ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]" : "border-[var(--border)]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="comment" className="text-sm font-medium">{t.comment}</label>
        <textarea id="comment" name="comment" rows={3} maxLength={1000} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-500)]" />
      </div>
      {error && <p role="alert" className="notice notice-danger">{error}</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
