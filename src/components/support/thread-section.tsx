"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { markThreadRead, sendSupportMessage } from "@/app/(fr)/messages/support-actions";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import type { Locale } from "@/i18n/dictionaries";

export type SupportMsg = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  read_at?: string | null;
};

/** Message affiché : réel (venu de la base) ou optimiste (en cours d'envoi / échoué). */
type Row = SupportMsg & { local?: "sending" | "failed" };

const BODY_MAX = 5000;
const TYPING_TTL_MS = 3500;
const TYPING_THROTTLE_MS = 1800;
const GROUP_GAP_MS = 5 * 60 * 1000;
const TZ = "Africa/Abidjan";

const copy = {
  fr: {
    online: "En ligne",
    offline: "Hors ligne",
    typing: "écrit…",
    team: "Équipe Toomny",
    you: "Vous",
    today: "Aujourd'hui",
    yesterday: "Hier",
    jump: "Nouveau message",
    jumpDown: "Dernier message",
    retry: "Échec · Réessayer",
    sent: "Envoyé",
    read: "Lu",
    hint: "Entrée pour envoyer · Maj+Entrée pour un saut de ligne",
    ai: "Brouillon IA",
    aiBusy: "Rédaction…",
    aiFail: "Le brouillon IA a échoué.",
    quickTitle: "Réponses rapides",
    emptyAdmin: "Aucun message. Écrivez le premier.",
    emptyProvider: "Écrivez votre premier message à l'équipe Toomny.",
    quick: [
      { label: "Merci", text: "Bonjour, merci pour votre message. Nous revenons vers vous très vite." },
      { label: "Pièces", text: "Pouvez-vous nous transmettre une capture d'écran ou plus de détails afin que nous puissions analyser la situation ?" },
      { label: "Vérifié", text: "Nous avons bien vérifié votre dossier : tout est en ordre de notre côté." },
      { label: "Résolu", text: "Le problème est résolu. N'hésitez pas à nous écrire si besoin, nous clôturons ce fil." },
    ],
  },
  en: {
    online: "Online",
    offline: "Offline",
    typing: "is typing…",
    team: "Toomny team",
    you: "You",
    today: "Today",
    yesterday: "Yesterday",
    jump: "New message",
    jumpDown: "Latest message",
    retry: "Failed · Retry",
    sent: "Sent",
    read: "Read",
    hint: "Enter to send · Shift+Enter for a new line",
    ai: "AI draft",
    aiBusy: "Drafting…",
    aiFail: "The AI draft failed.",
    quickTitle: "Quick replies",
    emptyAdmin: "No messages yet. Write the first one.",
    emptyProvider: "Write your first message to the Toomny team.",
    quick: [
      { label: "Thanks", text: "Hello, thanks for your message. We will get back to you very soon." },
      { label: "Details", text: "Could you send us a screenshot or more details so that we can look into the situation?" },
      { label: "Checked", text: "We have checked your file: everything is in order on our side." },
      { label: "Solved", text: "The issue is solved. Feel free to write to us if needed; we are closing this thread." },
    ],
  },
} as const;

type Props = {
  threadId: string;
  userId: string;
  isAdmin: boolean;
  isClosed: boolean;
  initialMessages: SupportMsg[];
  locale: Locale;
  /** Nom de l'interlocuteur affiché dans l'en-tête (prestataire côté admin, équipe côté prestataire). */
  peerName: string;
  /** Sujet du fil. */
  subject?: string;
  /** Pastille de statut déjà traduite (ex. « ouvert »). */
  statusLabel?: string;
  /** Actions d'en-tête (ex. bouton de clôture). */
  headerActions?: ReactNode;
  /** Lien de retour (mobile) vers la liste des conversations. */
  backHref?: string;
  className?: string;
};

function initialsOf(name: string) {
  return (
    name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function ThreadSection({
  threadId,
  userId,
  isAdmin,
  isClosed,
  initialMessages,
  locale,
  peerName,
  subject,
  statusLabel,
  headerActions,
  backHref,
  className = "",
}: Props) {
  const t = getMarketplaceTexts(locale).messages.support;
  const c = copy[locale === "en" ? "en" : "fr"];
  const dateLocale = locale === "en" ? "en-GB" : "fr-FR";

  const [rows, setRows] = useState<Row[]>(initialMessages);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [unseen, setUnseen] = useState(0);
  const [atBottom, setAtBottom] = useState(true);
  const [aiState, setAiState] = useState<"idle" | "busy">("idle");

  const scrollRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const atBottomRef = useRef(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Position initiale : tout en bas, sans animation.
  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  // Marque comme lus les messages de l'autre partie (onglet visible seulement).
  const markRead = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    void markThreadRead(threadId);
  }, [threadId]);

  useEffect(() => {
    document.addEventListener("visibilitychange", markRead);
    return () => document.removeEventListener("visibilitychange", markRead);
  }, [markRead]);

  // Temps réel : nouveaux messages, accusés de lecture, présence et « écrit… ».
  useEffect(() => {
    const channel = supabase.channel(`support:${threadId}`, { config: { presence: { key: userId } } });
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const incoming = payload.new as SupportMsg;
          setPeerTyping(false);
          setRows((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            // Remplace le message optimiste correspondant (même auteur, même texte).
            const idx = prev.findIndex((m) => m.local && m.sender_id === incoming.sender_id && m.body === incoming.body);
            if (idx !== -1) {
              const next = prev.slice();
              next.splice(idx, 1, incoming);
              return next;
            }
            return [...prev, incoming];
          });
          if (incoming.sender_id !== userId) {
            markRead();
            if (!atBottomRef.current) setUnseen((n) => n + 1);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "support_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const updated = payload.new as SupportMsg;
          setRows((prev) => prev.map((m) => (m.id === updated.id ? { ...m, read_at: updated.read_at } : m)));
        },
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if ((payload as { userId?: string })?.userId === userId) return;
        setPeerTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setPeerTyping(false), TYPING_TTL_MS);
      })
      .on("presence", { event: "sync" }, () => {
        const keys = Object.keys(channel.presenceState());
        setPeerOnline(keys.some((k) => k !== userId));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ at: Date.now() });
      });

    markRead();
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [threadId, userId, supabase, markRead]);

  // Suit les nouveaux messages si l'on est en bas ; sinon, laisse le bouton « nouveau message ».
  useEffect(() => {
    if (atBottomRef.current) scrollToBottom(true);
  }, [rows.length, peerTyping, scrollToBottom]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    atBottomRef.current = near;
    setAtBottom(near);
    if (near) setUnseen(0);
  }

  function resize() {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }

  /** Annonce « écrit… » à l'autre participant, au plus une fois par fenêtre de throttle. */
  const emitTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSent.current < TYPING_THROTTLE_MS) return;
    lastTypingSent.current = now;
    void channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId } });
  }, [userId]);

  function onType(value: string) {
    setText(value);
    requestAnimationFrame(resize);
    if (value) emitTyping();
  }

  async function deliver(body: string, tempId: string) {
    const result = await sendSupportMessage({ threadId, body });
    if ("error" in result) {
      setError(result.error);
      setRows((prev) => prev.map((m) => (m.id === tempId ? { ...m, local: "failed" } : m)));
      return;
    }
    // Le message réel arrive par le temps réel ; on garde l'optimiste « envoyé » d'ici là.
    setRows((prev) => prev.map((m) => (m.id === tempId ? { ...m, local: undefined } : m)));
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    if (!body || isClosed) return;
    if (body.length > BODY_MAX) {
      setError(t.messageLength);
      return;
    }
    setError(null);
    const tempId = `local-${crypto.randomUUID()}`;
    setRows((prev) => [
      ...prev,
      { id: tempId, body, sender_id: userId, created_at: new Date().toISOString(), read_at: null, local: "sending" },
    ]);
    setText("");
    requestAnimationFrame(() => {
      resize();
      scrollToBottom(true);
    });
    atBottomRef.current = true;
    void deliver(body, tempId);
  }

  function retry(row: Row) {
    setError(null);
    setRows((prev) => prev.map((m) => (m.id === row.id ? { ...m, local: "sending" } : m)));
    void deliver(row.body, row.id);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  function insertQuick(value: string) {
    setText((prev) => (prev.trim() ? `${prev.trimEnd()}\n${value}` : value));
    requestAnimationFrame(() => {
      resize();
      areaRef.current?.focus();
    });
  }

  /** Brouillon IA (admin) : le flux est écrit directement dans la zone de saisie, à relire avant envoi. */
  async function aiDraft() {
    if (aiState === "busy") return;
    setAiState("busy");
    setError(null);
    setText("");
    try {
      const res = await fetch("/api/admin/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      });
      if (!res.ok || !res.body) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const payload = part.slice(6);
          if (payload === "[DONE]") {
            done = true;
            break;
          }
          const parsed = JSON.parse(payload) as { text?: string; error?: string };
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) {
            const piece = parsed.text;
            setText((prev) => prev + piece);
            requestAnimationFrame(resize);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? `${c.aiFail} ${err.message}` : c.aiFail);
    } finally {
      setAiState("idle");
      areaRef.current?.focus();
    }
  }

  // ── Présentation ───────────────────────────────────────────────────────────
  const timeFmt = useMemo(() => new Intl.DateTimeFormat(dateLocale, { hour: "2-digit", minute: "2-digit", timeZone: TZ }), [dateLocale]);
  const dayKey = useMemo(() => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }), []);
  const dayLabel = useCallback(
    (iso: string) => {
      const d = new Date(iso);
      const key = dayKey.format(d);
      const now = Date.now();
      if (key === dayKey.format(now)) return c.today;
      if (key === dayKey.format(now - 86_400_000)) return c.yesterday;
      return new Intl.DateTimeFormat(dateLocale, { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(d);
    },
    [dayKey, dateLocale, c.today, c.yesterday],
  );

  const lastMineIdx = useMemo(() => {
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i].sender_id === userId) return i;
    return -1;
  }, [rows, userId]);

  const peerLabel = peerName || c.team;
  const showEmpty = rows.length === 0;

  return (
    <section className={`glass chat-pane ${className}`}>
      {/* ── En-tête ── */}
      <header className="flex flex-none items-center gap-3 border-b border-[var(--border)] px-4 py-3">
        {backHref && (
          <a href={backHref} aria-label={t.openThreads} className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[var(--subtle)] hover:bg-white/10 hover:text-[var(--foreground)] lg:hidden">
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
        <span className="relative flex-none">
          <span
            aria-hidden
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#8bf0b6] to-[#14a05a] font-display text-sm font-bold text-[#04110b] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_18px_-8px_rgba(51,209,122,0.8)] ring-1 ring-white/25"
          >
            {initialsOf(peerLabel)}
          </span>
          <span className={`chat-presence absolute -bottom-0.5 -right-0.5 ${peerOnline ? "chat-presence-on" : ""}`} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-[15px] font-bold leading-tight">{peerLabel}</h2>
          <p className="truncate text-xs text-[var(--subtle)]" aria-live="polite">
            {peerTyping ? (
              <span className="font-semibold text-[var(--accent)]">{c.typing}</span>
            ) : (
              <>
                {peerOnline ? c.online : c.offline}
                {subject ? ` · ${subject}` : ""}
              </>
            )}
          </p>
        </div>
        {statusLabel && (
          <span
            className={`hidden flex-none rounded-full border px-2.5 py-0.5 text-[11px] font-bold sm:inline-block ${
              isClosed
                ? "border-[var(--border)] bg-white/5 text-[var(--subtle)]"
                : "border-[rgba(139,240,182,0.3)] bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]"
            }`}
          >
            {statusLabel}
          </span>
        )}
        {headerActions}
      </header>

      {/* ── Fil de messages ── */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={scrollRef} onScroll={onScroll} className="chat-scroll" role="log" aria-live="polite" aria-label={subject ?? peerLabel}>
          {showEmpty && (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center">
              <span aria-hidden className="glass-icon glass-icon-brand h-14 w-14">
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                </svg>
              </span>
              <p className="max-w-xs text-sm text-[var(--subtle)]">{isAdmin ? c.emptyAdmin : c.emptyProvider}</p>
            </div>
          )}

          {rows.map((m, i) => {
            const mine = m.sender_id === userId;
            const prev = rows[i - 1];
            const next = rows[i + 1];
            const newDay = !prev || dayKey.format(new Date(prev.created_at)) !== dayKey.format(new Date(m.created_at));
            const sameAsPrev =
              !!prev && !newDay && prev.sender_id === m.sender_id && +new Date(m.created_at) - +new Date(prev.created_at) < GROUP_GAP_MS;
            const sameAsNext =
              !!next &&
              next.sender_id === m.sender_id &&
              dayKey.format(new Date(next.created_at)) === dayKey.format(new Date(m.created_at)) &&
              +new Date(next.created_at) - +new Date(m.created_at) < GROUP_GAP_MS;

            // Coins : la queue de la bulle n'apparaît que sur le dernier message d'un groupe.
            const radius = mine
              ? `${sameAsPrev ? "rounded-tr-md" : ""} ${sameAsNext ? "rounded-br-md" : "rounded-br-[6px]"}`
              : `${sameAsPrev ? "rounded-tl-md" : ""} ${sameAsNext ? "rounded-bl-md" : "rounded-bl-[6px]"}`;

            return (
              <div key={m.id}>
                {newDay && (
                  <div className="chat-day" suppressHydrationWarning>
                    {dayLabel(m.created_at)}
                  </div>
                )}
                <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${sameAsPrev ? "mt-0.5" : "mt-3"}`}>
                  {!mine && (
                    <span className="w-8 flex-none">
                      {!sameAsNext && (
                        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#f4dca6] to-[#d29a38] text-[11px] font-bold text-[#2a1d05] ring-1 ring-white/25">
                          {initialsOf(peerLabel)}
                        </span>
                      )}
                    </span>
                  )}
                  <div
                    className={`chat-bubble rounded-[20px] ${radius} ${mine ? "chat-bubble-mine" : ""} ${
                      m.local === "sending" ? "chat-bubble-pending" : ""
                    } ${m.local === "failed" ? "chat-bubble-failed" : ""}`}
                  >
                    {m.body}
                    <span className="chat-meta" suppressHydrationWarning>
                      {timeFmt.format(new Date(m.created_at))}
                      {mine && <Receipt row={m} labelRead={c.read} labelSent={c.sent} />}
                    </span>
                    {m.local === "failed" && (
                      <button type="button" onClick={() => retry(m)} className="mt-1 block text-xs font-bold underline underline-offset-2">
                        {c.retry}
                      </button>
                    )}
                  </div>
                </div>
                {mine && i === lastMineIdx && m.read_at && !m.local && (
                  <p className="mr-1 mt-1 text-right text-[10px] font-semibold text-[var(--accent)]">{c.read}</p>
                )}
              </div>
            );
          })}

          {peerTyping && (
            <div className="mt-3 flex items-end gap-2">
              <span className="w-8 flex-none" />
              <span className="chat-typing" aria-label={`${peerLabel} ${c.typing}`}>
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
        </div>

        {!atBottom && (
          <button
            type="button"
            className="chat-jump"
            onClick={() => {
              scrollToBottom(true);
              setUnseen(0);
            }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
              <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unseen > 0 ? `${unseen} · ${c.jump}` : c.jumpDown}
          </button>
        )}
      </div>

      {/* ── Saisie ── */}
      {isClosed ? (
        <p className="flex-none border-t border-[var(--border)] px-4 py-4 text-center text-sm text-[var(--subtle)]">{t.threadClosed}</p>
      ) : (
        <form onSubmit={submit} className="chat-composer flex-none">
          {isAdmin && (
            <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-0.5" aria-label={c.quickTitle}>
              <button type="button" onClick={() => void aiDraft()} disabled={aiState === "busy"} className="chat-qr border-[rgba(139,240,182,0.35)] text-[var(--accent)] disabled:opacity-60">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden className={aiState === "busy" ? "animate-pulse" : ""}>
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
                </svg>
                {aiState === "busy" ? c.aiBusy : c.ai}
              </button>
              <span aria-hidden className="h-4 w-px flex-none bg-[var(--border)]" />
              {c.quick.map((q) => (
                <button key={q.label} type="button" className="chat-qr" onClick={() => insertQuick(q.text)} title={q.text}>
                  {q.label}
                </button>
              ))}
            </div>
          )}

          <div className="chat-composer-box">
            <textarea
              ref={areaRef}
              value={text}
              rows={1}
              maxLength={BODY_MAX}
              placeholder={t.messagePlaceholder}
              aria-label={t.messagePlaceholder}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={onKeyDown}
              readOnly={aiState === "busy"}
            />
            {text.length > BODY_MAX - 500 && (
              <span className="mb-2 flex-none text-[11px] tabular-nums text-[var(--subtle)]">
                {text.length}/{BODY_MAX}
              </span>
            )}
            <button type="submit" className="chat-send" disabled={!text.trim() || aiState === "busy"} aria-label={t.send}>
              <svg className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3 px-2">
            <span className="hidden text-[11px] text-[var(--subtle)] sm:block">{c.hint}</span>
            {error && (
              <p role="alert" className="text-xs font-semibold text-[var(--tone-danger-fg)]">
                {error}
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

/** Coches d'état d'un message envoyé : horloge, envoyé, lu. */
function Receipt({ row, labelRead, labelSent }: { row: Row; labelRead: string; labelSent: string }) {
  if (row.local === "sending") {
    return (
      <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4.5V8l2.2 1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (row.local === "failed") return null;
  const read = !!row.read_at;
  return (
    <svg className={`h-3.5 w-3.5 ${read ? "text-[#0a552d] opacity-100" : ""}`} viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth={1.9} role="img" aria-label={read ? labelRead : labelSent}>
      <path d="M2 8.5l3.5 3.5L12 4.5" strokeLinecap="round" strokeLinejoin="round" />
      {read && <path d="M9 11.5l.5.5L17 4.5" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
