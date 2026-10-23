"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ATTACHMENTS_PER_MESSAGE, validateAttachment } from "@/lib/support-attachments";
import { SUPPORT_REPLY_MAX } from "@/lib/support-replies";

export type PaneRole = "admin" | "requester";

export type PaneMessage = {
  id: string;
  role: PaneRole;
  body: string;
  timeLabel: string;
  quote: { role: PaneRole; body: string } | null;
  attachments: { id: string; url: string | null }[];
};

export type PaneRequest = {
  id: string;
  subject: string;
  closed: boolean;
  requesterName: string;
  requesterEmail: string | null;
  statusLabel: string;
  statusTone: "neutral" | "warning" | "success";
  createdLabel: string;
};

type SendResult = { success: true } | { error: string };

type Copy = {
  you: string;
  team: string;
  replyTo: string;
  replyHint: string;
  quoteCancel: string;
  quotingFrom: (name: string) => string;
  placeholder: string;
  send: string;
  sending: string;
  attach: string;
  attachHint: string;
  uploading: string;
  uploadFailed: string;
  removeFile: string;
  imageAlt: string;
  draft: string;
  drafting: string;
  draftHint: string;
  closeConfirm: string;
  closedNotice: string;
  back: string;
  empty: string;
  counter: (n: number, max: number) => string;
};

const copy: Record<"fr" | "en", Copy> = {
  fr: {
    you: "Vous",
    team: "Équipe Toomny",
    replyTo: "Répondre à ce message",
    replyHint: "Cliquer pour répondre",
    quoteCancel: "Annuler la citation",
    quotingFrom: (name) => `En réponse à ${name}`,
    placeholder: "Écrivez votre message…",
    send: "Envoyer",
    sending: "Envoi…",
    attach: "Joindre une capture",
    attachHint: "PNG, JPEG ou WebP, 5 Mo max, 4 images par message.",
    uploading: "Envoi de l'image…",
    uploadFailed: "Image refusée.",
    removeFile: "Retirer",
    imageAlt: "Capture d'écran jointe",
    draft: "Rédiger avec l'IA",
    drafting: "Rédaction…",
    draftHint: "Brouillon généré. Relisez-le avant d'envoyer.",
    closeConfirm: "Clôturer cette demande ? Les captures d'écran seront supprimées.",
    closedNotice: "Cette demande est résolue. Les captures d'écran ont été supprimées.",
    back: "Retour aux conversations",
    empty: "Sélectionnez une conversation pour la lire.",
    counter: (n, max) => `${n}/${max}`,
  },
  en: {
    you: "You",
    team: "Toomny team",
    replyTo: "Reply to this message",
    replyHint: "Click to reply",
    quoteCancel: "Cancel quote",
    quotingFrom: (name) => `Replying to ${name}`,
    placeholder: "Write your message…",
    send: "Send",
    sending: "Sending…",
    attach: "Attach a screenshot",
    attachHint: "PNG, JPEG or WebP, 5 MB max, 4 images per message.",
    uploading: "Uploading image…",
    uploadFailed: "Image rejected.",
    removeFile: "Remove",
    imageAlt: "Attached screenshot",
    draft: "Draft with AI",
    drafting: "Drafting…",
    draftHint: "Draft generated. Review it before sending.",
    closeConfirm: "Close this request? Screenshots will be deleted.",
    closedNotice: "This request is resolved. Screenshots have been deleted.",
    back: "Back to conversations",
    empty: "Select a conversation to read it.",
    counter: (n, max) => `${n}/${max}`,
  },
};

type Pending = { key: string; preview: string; status: "uploading" | "ready" | "error"; id?: string; error?: string };

const TONE = {
  neutral: "bg-[var(--surface)] text-[var(--subtle)]",
  warning: "bg-[var(--tone-warning-bg)] text-[var(--tone-warning-fg)]",
  success: "bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]",
} as const;

/**
 * Volet d'une conversation : fil de messages, citation en cliquant sur un message,
 * captures d'écran, zone de réponse. Le même composant sert à l'équipe et au demandeur.
 */
export function ConversationPane({
  viewer,
  locale,
  request,
  messages,
  backHref,
  sendAction,
  closeAction,
  closeLabel,
  draftAction,
  readinessPanel,
}: {
  viewer: PaneRole;
  locale: "fr" | "en";
  request: PaneRequest;
  messages: PaneMessage[];
  backHref: string;
  sendAction: (formData: FormData) => Promise<SendResult>;
  closeAction: (formData: FormData) => Promise<void>;
  closeLabel: string;
  draftAction?: (requestId: string) => Promise<{ text: string } | { error: string }>;
  readinessPanel?: React.ReactNode;
}) {
  const t = copy[locale];
  const router = useRouter();
  const scroller = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [quote, setQuote] = useState<PaneMessage | null>(null);
  const [files, setFiles] = useState<Pending[]>([]);
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Le fil défile vers le dernier message à chaque changement de conversation ou de message.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages.length, request.id]);

  // Aperçus locaux libérés au démontage (changement de conversation inclus).
  const filesRef = useRef<Pending[]>([]);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => {
    return () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
  }, []);

  const uploading = files.some((f) => f.status === "uploading");
  const readyIds = files.filter((f) => f.status === "ready" && f.id).map((f) => f.id as string);
  const roleName = (role: PaneRole) => (role === viewer ? t.you : t.team);

  async function addFiles(list: FileList) {
    const room = ATTACHMENTS_PER_MESSAGE - files.length;
    for (const file of Array.from(list).slice(0, Math.max(room, 0))) {
      const check = validateAttachment({ bytes: file.size, mime: file.type || null });
      const key = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      if ("error" in check) {
        setFiles((prev) => [...prev, { key, preview, status: "error", error: check.error }]);
        continue;
      }
      setFiles((prev) => [...prev, { key, preview, status: "uploading" }]);

      const fd = new FormData();
      fd.append("requestId", request.id);
      fd.append("file", file);
      try {
        const res = await fetch("/api/support/attachments", { method: "POST", body: fd });
        const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
        setFiles((prev) =>
          prev.map((f) =>
            f.key !== key
              ? f
              : res.ok && data.id
                ? { ...f, status: "ready", id: data.id }
                : { ...f, status: "error", error: data.error ?? t.uploadFailed },
          ),
        );
      } catch {
        setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, status: "error", error: t.uploadFailed } : f)));
      }
    }
  }

  function removeFile(key: string) {
    setFiles((prev) => {
      const target = prev.find((f) => f.key === key);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.key !== key);
    });
  }

  function clearComposer() {
    setText("");
    setQuote(null);
    setFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.preview));
      return [];
    });
  }

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending || uploading || text.trim() === "") return;
    setSending(true);
    setError(null);
    setNotice(null);
    const fd = new FormData();
    fd.append("requestId", request.id);
    fd.append("body", text);
    fd.append("attachmentIds", readyIds.join(","));
    fd.append("quoteRole", quote?.role ?? "");
    fd.append("quoteBody", quote?.body ?? "");
    const result = await sendAction(fd);
    setSending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    clearComposer();
    router.refresh();
  }

  async function onDraft() {
    if (!draftAction) return;
    setDrafting(true);
    setError(null);
    setNotice(null);
    const result = await draftAction(request.id);
    setDrafting(false);
    if ("error" in result) setError(result.error);
    else {
      setText(result.text);
      setNotice(t.draftHint);
    }
  }

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] p-4">
        <div className="min-w-0">
          <Link href={backHref} className="mb-1 inline-block text-xs font-medium text-[var(--subtle)] hover:text-[var(--foreground)] lg:hidden">
            ← {t.back}
          </Link>
          <h2 className="truncate font-display text-base font-bold">{request.subject}</h2>
          <p className="truncate text-xs text-[var(--subtle)]">
            {request.requesterName}
            {request.requesterEmail ? ` · ${request.requesterEmail}` : ""} · {request.createdLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[request.statusTone]}`}>{request.statusLabel}</span>
          {!request.closed && (
            <form
              action={closeAction}
              onSubmit={(e) => {
                if (!window.confirm(t.closeConfirm)) e.preventDefault();
              }}
            >
              <input type="hidden" name="requestId" value={request.id} />
              <button type="submit" className="btn-ghost btn-sm">{closeLabel}</button>
            </form>
          )}
        </div>
      </header>

      {readinessPanel && <div className="border-b border-[var(--border)] p-4">{readinessPanel}</div>}

      <div ref={scroller} className="min-h-[260px] flex-1 space-y-4 overflow-y-auto bg-[var(--surface)] p-4 lg:min-h-0">
        {messages.map((m) => {
          const mine = m.role === viewer;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <button
                type="button"
                onClick={() => setQuote(m)}
                aria-label={t.replyTo}
                className={`group max-w-[88%] rounded-2xl px-4 py-3 text-left text-sm shadow-sm transition hover:ring-2 hover:ring-[var(--color-brand-300)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] ${
                  mine
                    ? "rounded-br-md bg-[var(--color-brand-50)]"
                    : "rounded-bl-md border border-[var(--border)] bg-[var(--background)]"
                }`}
              >
                <span className="block text-[11px] font-semibold text-[var(--subtle)]">
                  {roleName(m.role)} · {m.timeLabel}
                </span>
                {m.quote && (
                  <span className="mt-1.5 block border-l-2 border-[var(--color-brand-300)] pl-2 text-xs text-[var(--subtle)]">
                    {roleName(m.quote.role)} : {m.quote.body}
                  </span>
                )}
                <span className="mt-1 block whitespace-pre-line break-words">{m.body}</span>
                <span className="mt-1 block text-[10px] text-[var(--subtle)] opacity-0 transition-opacity group-hover:opacity-100">
                  {t.replyHint}
                </span>
              </button>
              {m.attachments.length > 0 && (
                <div className="mt-2 flex max-w-[88%] flex-wrap gap-2">
                  {m.attachments.map((a) =>
                    a.url ? (
                      <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="relative block h-32 w-44 overflow-hidden rounded-xl border border-[var(--border)]">
                        <Image src={a.url} alt={t.imageAlt} fill unoptimized sizes="176px" className="object-cover" />
                      </a>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          );
        })}
        {messages.length === 0 && <p className="text-center text-sm text-[var(--subtle)]">{t.empty}</p>}
      </div>

      {request.closed ? (
        <p className="border-t border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--subtle)]">{t.closedNotice}</p>
      ) : (
        <form onSubmit={send} className="space-y-3 border-t border-[var(--border)] bg-[var(--background)] p-4">
          {quote && (
            <div className="flex items-start justify-between gap-3 rounded-xl border-l-2 border-[var(--color-brand-500)] bg-[var(--surface)] p-3 text-xs">
              <div className="min-w-0">
                <p className="font-semibold">{t.quotingFrom(roleName(quote.role))}</p>
                <p className="truncate text-[var(--subtle)]">{quote.body}</p>
              </div>
              <button type="button" onClick={() => setQuote(null)} className="shrink-0 font-medium text-[var(--subtle)] hover:text-[var(--foreground)]">
                {t.quoteCancel}
              </button>
            </div>
          )}

          {files.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {files.map((f) => (
                <li key={f.key} className="relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--border)]">
                  <Image src={f.preview} alt="" fill unoptimized sizes="80px" className="object-cover" />
                  {f.status === "uploading" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] font-semibold text-white">{t.uploading}</span>
                  )}
                  {f.status === "error" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-rose-900/70 p-1 text-center text-[10px] text-white">{f.error}</span>
                  )}
                  <button type="button" onClick={() => removeFile(f.key)} className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-[10px] text-white" aria-label={t.removeFile}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={SUPPORT_REPLY_MAX}
            disabled={sending}
            placeholder={t.placeholder}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-brand-500)]"
          />

          <div className="flex flex-wrap items-center gap-2">
            <label className="btn-ghost btn-sm cursor-pointer" title={t.attachHint}>
              {t.attach}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                disabled={files.length >= ATTACHMENTS_PER_MESSAGE || sending}
                onChange={(e) => {
                  if (e.target.files) void addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {draftAction && (
              <button type="button" onClick={onDraft} disabled={drafting || sending} className="btn-ghost btn-sm">
                {drafting ? t.drafting : t.draft}
              </button>
            )}
            <span className="ml-auto text-[11px] text-[var(--subtle)]">{t.counter(text.length, SUPPORT_REPLY_MAX)}</span>
            <button type="submit" disabled={sending || uploading || text.trim() === ""} className="btn-primary btn-sm">
              {sending ? t.sending : t.send}
            </button>
          </div>
          {error && <p role="alert" className="text-xs text-[var(--tone-danger-fg)]">{error}</p>}
          {notice && <p role="status" className="text-xs text-[var(--subtle)]">{notice}</p>}
        </form>
      )}
    </section>
  );
}
