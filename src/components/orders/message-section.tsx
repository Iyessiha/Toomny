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
  attachment_path?: string | null;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

// Regex simple pour détecter un partage de coordonnées dans le message.
const LEAK_RE = /(\+?[\d\s\-().]{8,}|\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})/i;

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
  const [showLeakWarning, setShowLeakWarning] = useState(false);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Realtime — écoute les INSERT sur les messages de cette commande.
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` },
        (payload) => {
          const incoming = payload.new as Msg;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleTextChange() {
    const val = textareaRef.current?.value ?? "";
    setShowLeakWarning(LEAK_RE.test(val));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) { setAttachFile(null); setAttachPreview(null); return; }
    if (file.size > MAX_FILE_BYTES || !ALLOWED_MIME.includes(file.type)) {
      setError(t.attachError);
      e.target.value = "";
      return;
    }
    setError(null);
    setAttachFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setAttachPreview(url);
    } else {
      setAttachPreview(null);
    }
  }

  function removeAttach() {
    setAttachFile(null);
    setAttachPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadAttachment(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${orderId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return null;
    return path;
  }

  async function getAttachUrl(path: string): Promise<string | null> {
    const { data } = await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = textareaRef.current?.value?.trim() ?? "";
    if (!body && !attachFile) return;

    setPending(true);
    setError(null);

    let attachPath: string | undefined;
    if (attachFile) {
      const uploaded = await uploadAttachment(attachFile);
      if (!uploaded) {
        setError(t.attachError);
        setPending(false);
        return;
      }
      attachPath = uploaded;
    }

    const result = await sendMessage({ orderId, body: body || "📎", attachmentPath: attachPath });
    setPending(false);

    if ("error" in result) {
      setError(result.error ?? null);
      return;
    }
    if (textareaRef.current) textareaRef.current.value = "";
    setShowLeakWarning(false);
    removeAttach();
  }

  return (
    <section>
      <h2 className="font-display text-lg font-bold">{t.exchanges}</h2>

      {/* Bannière de sécurité */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
        <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>{t.safetyBanner}</span>
      </div>

      {/* Fil de messages */}
      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
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
              {m.body !== "📎" && (
                <p className="whitespace-pre-line leading-relaxed">{m.body}</p>
              )}
              {m.attachment_path && (
                <AttachmentPreview path={m.attachment_path} label={t.attachView} supabase={supabase} />
              )}
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
        {/* Prévisualisation pièce jointe */}
        {attachFile && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            {attachPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={attachPreview} alt="" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{attachFile.name}</p>
              <p className="text-xs text-[var(--subtle)]">
                {(attachFile.size / 1024 / 1024).toFixed(2)} Mo
              </p>
            </div>
            <button type="button" onClick={removeAttach} className="text-[var(--subtle)] hover:text-[var(--foreground)]" aria-label="Retirer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={3}
          maxLength={2000}
          placeholder={t.messagePlaceholder}
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20"
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />

        {/* Avertissement fuite de coordonnées */}
        {showLeakWarning && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs text-orange-800 dark:border-orange-800/40 dark:bg-orange-950/30 dark:text-orange-300">
            <svg className="mt-0.5 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{t.leakWarning}</span>
          </div>
        )}

        {error && (
          <p role="alert" className="notice notice-danger">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-brand-600)] active:scale-95 disabled:opacity-60"
          >
            {pending ? t.sending : t.send}
          </button>

          {/* Bouton pièce jointe */}
          <label
            title={t.attachTooltip}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 py-2.5 text-xs font-medium text-[var(--subtle)] transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--foreground)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            {t.attach}
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept={ALLOWED_MIME.join(",")}
              onChange={handleFileChange}
            />
          </label>

          <span className="text-xs text-[var(--subtle)]">Ctrl+↵</span>
        </div>
      </form>
    </section>
  );
}

// Sous-composant : affiche une pièce jointe avec URL signée.
function AttachmentPreview({
  path,
  label,
  supabase,
}: {
  path: string;
  label: string;
  supabase: ReturnType<typeof createClient>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const isPdf = path.endsWith(".pdf");

  useEffect(() => {
    supabase.storage
      .from("chat-attachments")
      .createSignedUrl(path, 3600)
      .then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path, supabase]);

  if (!url) return <p className="mt-1 text-xs opacity-60">…</p>;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2 rounded-lg border border-current/20 px-3 py-2 text-xs font-medium underline-offset-2 hover:underline"
    >
      {isPdf ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
        </svg>
      )}
      {label}
    </a>
  );
}
