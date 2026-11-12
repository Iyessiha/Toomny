"use client";

import { useState, useRef } from "react";
import { sendSupportMessage } from "@/app/(fr)/messages/support-actions";

type Props = {
  threadId: string;
  locale: string;
};

type State = "idle" | "loading" | "streaming" | "done" | "error";

export function AiDraftButton({ threadId, locale }: Props) {
  const [state, setState] = useState<State>("idle");
  const [draft, setDraft] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEn = locale === "en";
  const labels = {
    analyze: isEn ? "Analyze with AI" : "Analyser avec l'IA",
    analyzing: isEn ? "Analyzing…" : "Analyse en cours…",
    send: isEn ? "Send this message" : "Envoyer ce message",
    sending: isEn ? "Sending…" : "Envoi…",
    reset: isEn ? "Start over" : "Recommencer",
    placeholder: isEn ? "AI draft will appear here…" : "Le brouillon de l'IA apparaîtra ici…",
    errorTitle: isEn ? "AI analysis failed" : "Analyse IA échouée",
  };

  async function handleAnalyze() {
    setState("loading");
    setDraft("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error("Pas de flux de réponse");

      setState("streaming");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const payload = part.slice(6);
          if (payload === "[DONE]") {
            setState("done");
            break;
          }
          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              setDraft((prev) => {
                const next = prev + parsed.text;
                // Auto-resize textarea
                if (textareaRef.current) {
                  textareaRef.current.style.height = "auto";
                  textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
                }
                return next;
              });
            }
          } catch (e) {
            if (e instanceof Error) throw e;
          }
        }
      }

      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
      setState("error");
    }
  }

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await sendSupportMessage({ threadId, body: draft.trim() });
      setState("idle");
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 space-y-3">
      {/* Bouton principal */}
      {state === "idle" && (
        <button
          onClick={handleAnalyze}
          className="flex items-center gap-2 rounded-full border border-[var(--color-brand-500)] px-4 py-2 text-sm font-medium text-[var(--color-brand-500)] transition-all hover:bg-[var(--color-brand-500)] hover:text-white active:scale-95"
        >
          <SparkleIcon />
          {labels.analyze}
        </button>
      )}

      {/* Chargement initial */}
      {state === "loading" && (
        <div className="flex items-center gap-2 text-sm text-[var(--subtle)]">
          <SpinnerIcon />
          {labels.analyzing}
        </div>
      )}

      {/* Textarea en cours de streaming ou terminée */}
      {(state === "streaming" || state === "done") && (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand-500)]">
              <SparkleIcon />
              {isEn ? "AI draft" : "Brouillon IA"}
              {state === "streaming" && <SpinnerIcon size={12} />}
            </span>
            <button
              onClick={() => { setState("idle"); setDraft(""); }}
              className="text-xs text-[var(--subtle)] hover:text-[var(--foreground)] transition-colors"
            >
              {labels.reset}
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            readOnly={state === "streaming"}
            rows={4}
            className="w-full resize-none overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20"
            placeholder={labels.placeholder}
          />
          {state === "done" && (
            <button
              onClick={handleSend}
              disabled={sending || !draft.trim()}
              className="rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-brand-600)] active:scale-95 disabled:opacity-60"
            >
              {sending ? labels.sending : labels.send}
            </button>
          )}
        </>
      )}

      {/* Erreur */}
      {state === "error" && (
        <div className="space-y-2">
          <p className="text-sm text-red-600 dark:text-red-400">
            <span className="font-medium">{labels.errorTitle} :</span> {errorMsg}
          </p>
          <button
            onClick={() => setState("idle")}
            className="text-xs text-[var(--subtle)] underline hover:text-[var(--foreground)]"
          >
            {labels.reset}
          </button>
        </div>
      )}
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  );
}

function SpinnerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
