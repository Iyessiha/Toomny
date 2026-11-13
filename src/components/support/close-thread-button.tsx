"use client";

import { useState } from "react";
import { closeSupportThread } from "@/app/(fr)/messages/support-actions";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import type { Locale } from "@/i18n/dictionaries";

export function CloseThreadButton({
  threadId,
  locale,
}: {
  threadId: string;
  locale: Locale;
}) {
  const t = getMarketplaceTexts(locale).messages.support;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClose() {
    if (!window.confirm(t.closeConfirm)) return;
    setPending(true);
    setError(null);
    const result = await closeSupportThread(threadId);
    setPending(false);
    if ("error" in result) setError(result.error);
  }

  return (
    <div className="flex-none">
      <button
        onClick={handleClose}
        disabled={pending}
        className="chat-qr hover:!border-[rgba(255,138,132,0.5)] hover:!bg-[var(--tone-danger-bg)] hover:!text-[var(--tone-danger-fg)] disabled:opacity-50"
      >
        {pending ? t.closingThread : t.closeThread}
      </button>
      {error && <p role="alert" className="mt-1 text-xs text-[var(--tone-danger-fg)]">{error}</p>}
    </div>
  );
}
