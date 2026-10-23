"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markSupportSeen, replyToSupportRequest } from "@/app/(fr)/dashboard/support/actions";
import { SUPPORT_REPLY_MAX } from "@/lib/support-replies";

const copy = {
  fr: {
    placeholder: "Votre message à l'équipe Toomny…",
    send: "Envoyer",
    sending: "Envoi…",
    sent: "Message envoyé. L'équipe vous répondra ici.",
  },
  en: {
    placeholder: "Your message to the Toomny team…",
    send: "Send",
    sending: "Sending…",
    sent: "Message sent. The team will reply here.",
  },
} as const;

/** Marque les conversations comme vues à l'ouverture de la page. */
export function SupportSeenMarker() {
  useEffect(() => {
    void markSupportSeen();
  }, []);
  return null;
}

export function SupportConversationReply({ requestId, locale }: { requestId: string; locale: "fr" | "en" }) {
  const t = copy[locale];
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setError(null);
    setNotice(null);
    const fd = new FormData();
    fd.append("requestId", requestId);
    fd.append("body", text);
    startTransition(async () => {
      const result = await replyToSupportRequest(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setText("");
      setNotice(t.sent);
      router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={SUPPORT_REPLY_MAX}
        disabled={pending}
        placeholder={t.placeholder}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-brand-500)]"
      />
      <button type="button" onClick={send} disabled={pending || text.trim().length === 0} className="btn-primary btn-sm">
        {pending ? t.sending : t.send}
      </button>
      {error && <p role="alert" className="text-xs text-[var(--tone-danger-fg)]">{error}</p>}
      {notice && <p role="status" className="text-xs text-[var(--subtle)]">{notice}</p>}
    </div>
  );
}
