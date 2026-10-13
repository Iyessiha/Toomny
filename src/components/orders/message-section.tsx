"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/(fr)/orders/actions";
import { getDashboardTexts } from "@/i18n/dashboard";
import type { Locale } from "@/i18n/dictionaries";

type Msg = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
};

export function MessageSection({
  orderId,
  userId,
  initialMessages,
  locale,
}: {
  orderId: string;
  userId: string;
  initialMessages: Msg[];
  locale: Locale;
}) {
  const t = getDashboardTexts(locale).orders;
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Realtime — écoute les INSERT sur les messages de cette commande.
  useEffect(() => {
    const sb = createClient();
    const channel = sb
      .channel(`messages:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const incoming = payload.new as Msg;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [orderId]);

  // Scroll vers le bas à chaque nouveau message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = textareaRef.current?.value?.trim() ?? "";
    if (!body) return;

    setPending(true);
    setError(null);
    const result = await sendMessage({ orderId, body });
    setPending(false);

    if ("error" in result) {
      setError(result.error ?? null);
      return;
    }
    if (textareaRef.current) textareaRef.current.value = "";
    // Le realtime ramènera le message : pas besoin de router.refresh().
  }

  return (
    <section>
      <h2 className="font-display text-lg font-bold">{t.exchanges}</h2>

      {/* Fil de messages */}
      <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--subtle)]">{t.noMessages}</p>
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
                  { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }
                )}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Formulaire d'envoi */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        <textarea
          ref={textareaRef}
          required
          rows={3}
          maxLength={2000}
          placeholder={t.messagePlaceholder}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)] resize-none"
          onKeyDown={(e) => {
            // Ctrl+Entrée pour envoyer
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        {error && (
          <p role="alert" className="notice notice-danger">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60 hover:bg-[var(--color-brand-600)] active:scale-95"
          >
            {pending ? t.sending : t.send}
          </button>
          <span className="text-xs text-[var(--subtle)]">Ctrl+↵</span>
        </div>
      </form>
    </section>
  );
}
