"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { draftSupportReply, replySupportRequest } from "@/app/(fr)/admin/support/actions";
import { SUPPORT_REPLY_MAX } from "@/lib/support-replies";

export type SupportReplyCopy = {
  placeholder: string;
  draft: string;
  drafting: string;
  send: string;
  sending: string;
  draftHint: string;
  sent: string;
};

/**
 * Réponse à une demande de contact. Le brouillon IA remplit seulement la zone
 * de texte : l'envoi reste un geste explicite de l'administrateur.
 */
export function SupportReplyForm({
  requestId,
  copy,
}: {
  requestId: string;
  copy: SupportReplyCopy;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onDraft() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await draftSupportReply(requestId);
      if ("error" in result) setError(result.error);
      else {
        setText(result.text);
        setNotice(copy.draftHint);
      }
    });
  }

  function onSend() {
    setError(null);
    setNotice(null);
    const fd = new FormData();
    fd.append("requestId", requestId);
    fd.append("body", text);
    startTransition(async () => {
      const result = await replySupportRequest(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setText("");
      setNotice(copy.sent);
      router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={SUPPORT_REPLY_MAX}
        placeholder={copy.placeholder}
        disabled={pending}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-brand-500)]"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onDraft} disabled={pending} className="btn-ghost btn-sm">
          {pending ? copy.drafting : copy.draft}
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={pending || text.trim().length === 0}
          className="btn-primary btn-sm"
        >
          {pending ? copy.sending : copy.send}
        </button>
        <span className="text-[11px] text-[var(--subtle)]">
          {text.length}/{SUPPORT_REPLY_MAX}
        </span>
      </div>
      {error && <p role="alert" className="text-xs text-[var(--tone-danger-fg)]">{error}</p>}
      {notice && <p role="status" className="text-xs text-[var(--subtle)]">{notice}</p>}
    </div>
  );
}
