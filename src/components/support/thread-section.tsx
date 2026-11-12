"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendSupportMessage } from "@/app/(fr)/messages/support-actions";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import type { Locale } from "@/i18n/dictionaries";

type SupportMsg = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
};

export function ThreadSection({
  threadId,
  userId,
  isAdmin,
  isClosed,
  initialMessages,
  locale,
}: {
  threadId: string;
  userId: string;
  isAdmin: boolean;
  isClosed: boolean;
  initialMessages: SupportMsg[];
  locale: Locale;
}) {
  const t = getMarketplaceTexts(locale).messages.support;
  const [messages, setMessages] = useState<SupportMsg[]>(initialMessages);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Realtime — INSERT sur support_messages de ce thread
  useEffect(() => {
    const channel = supabase
      .channel(`support:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const incoming = payload.new as SupportMsg;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
          );
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [threadId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = textareaRef.current?.value?.trim() ?? "";
    if (!body) return;

    setPending(true);
    setError(null);
    const result = await sendSupportMessage({ threadId, body });
    setPending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    if (textareaRef.current) textareaRef.current.value = "";
  }

  return (
    <section>
      {/* Fil de messages */}
      <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-[var(--subtle)]">{t.noMessages}</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                mine
                  ? "ml-auto bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
                  : "bg-[var(--background)]"
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{m.body}</p>
              <p className="mt-1 text-xs opacity-60">
                {new Date(m.created_at).toLocaleString(
                  locale === "en" ? "en-GB" : "fr-FR",
                  { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" },
                )}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Formulaire */}
      {isClosed ? (
        <p className="mt-4 text-center text-sm text-[var(--subtle)]">{t.threadClosed}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-2">
          <textarea
            ref={textareaRef}
            rows={3}
            maxLength={5000}
            placeholder={t.messagePlaceholder}
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          {error && <p role="alert" className="notice notice-danger">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-brand-600)] active:scale-95 disabled:opacity-60"
            >
              {pending ? t.sending : t.send}
            </button>
            <span className="text-xs text-[var(--subtle)]">Ctrl+↵</span>
          </div>
        </form>
      )}
    </section>
  );
}
