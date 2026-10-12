"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markConversationRead } from "@/app/(fr)/demandes/actions";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import type { Locale } from "@/i18n/dictionaries";

export function MarkConversationReadButton({
  otherId,
  serviceId,
  unread,
  locale = "fr",
}: {
  otherId: string;
  serviceId: string | null;
  unread: number;
  locale?: Locale;
}) {
  const t = getMarketplaceTexts(locale).inquiries;
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (unread === 0) return null;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await markConversationRead({ otherId, serviceId });
        setPending(false);
        router.refresh();
      }}
      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium transition-colors hover:border-[var(--color-brand-400)] disabled:opacity-60"
    >
      {t.markRead} ({unread})
    </button>
  );
}
