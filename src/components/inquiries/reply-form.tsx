"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { replyToInquiry } from "@/app/(fr)/demandes/actions";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import type { Locale } from "@/i18n/dictionaries";

export function InquiryReplyForm({
  toId,
  serviceId,
  locale = "fr",
}: {
  toId: string;
  serviceId: string | null;
  locale?: Locale;
}) {
  const t = getMarketplaceTexts(locale).inquiries;
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = ref.current?.value ?? "";
    setPending(true);
    setError(null);
    const result = await replyToInquiry({ toId, serviceId, message });
    setPending(false);
    if ("error" in result) {
      setError(result.error ?? null);
      return;
    }
    if (ref.current) ref.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          required
          rows={2}
          maxLength={1000}
          placeholder={t.replyPlaceholder}
          aria-label={t.reply}
          className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand-500)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex-none rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? t.replying : t.reply}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
