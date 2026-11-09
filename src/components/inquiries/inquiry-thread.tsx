"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { editInquiryMessage } from "@/app/(fr)/demandes/actions";
import type { Locale } from "@/i18n/dictionaries";

export type ThreadMessage = {
  id: string;
  mine: boolean;
  message: string;
  createdAt: string;
  readAt: string | null;
  editedAt: string | null;
};

/**
 * Fil de discussion façon messagerie : bulles, défilement automatique vers le
 * dernier message, texte sélectionnable, copie et modification de ses propres
 * messages. Le champ de réponse est fourni par le parent (footer).
 */
export function InquiryThread({
  messages,
  locale = "fr",
  footer,
}: {
  messages: ThreadMessage[];
  locale?: Locale;
  footer: ReactNode;
}) {
  const fr = locale !== "en";
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Premier affichage : directement en bas. Ensuite : défilement doux à chaque nouveau message.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const first = lastCount.current === 0;
    box.scrollTo({ top: box.scrollHeight, behavior: first ? "auto" : "smooth" });
    lastCount.current = messages.length;
  }, [messages.length]);

  async function copy(m: ThreadMessage) {
    try {
      await navigator.clipboard.writeText(m.message);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId((cur) => (cur === m.id ? null : cur)), 1500);
    } catch {
      setError(fr ? "Copie impossible sur cet appareil." : "Copy not available on this device.");
    }
  }

  function startEdit(m: ThreadMessage) {
    setEditingId(m.id);
    setDraft(m.message);
    setError(null);
  }

  async function saveEdit(id: string) {
    setBusy(true);
    setError(null);
    const result = await editInquiryMessage({ id, message: draft });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  const timeFmt = new Intl.DateTimeFormat(fr ? "fr-FR" : "en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col">
      <div
        ref={boxRef}
        className="max-h-[60vh] min-h-32 space-y-2 overflow-y-auto overscroll-contain rounded-2xl bg-[var(--background)] p-3"
      >
        {messages.map((m) => {
          const bubble = m.mine
            ? "rounded-2xl rounded-br-md btn-fill text-white"
            : "rounded-2xl rounded-bl-md bg-[var(--surface)]";
          const editing = editingId === m.id;
          return (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%]">
                {editing ? (
                  <div className="flex flex-col gap-2 rounded-2xl bg-[var(--surface)] p-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-text-2)]"
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingId(null)} disabled={busy} className="btn-ghost btn-sm">
                        {fr ? "Annuler" : "Cancel"}
                      </button>
                      <button type="button" onClick={() => saveEdit(m.id)} disabled={busy} className="btn-primary btn-sm disabled:opacity-60">
                        {busy ? (fr ? "Enregistrement…" : "Saving…") : fr ? "Enregistrer" : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={`select-text whitespace-pre-line px-4 py-2.5 text-sm ${bubble}`}>{m.message}</p>
                )}
                <div className={`mt-1 flex items-center gap-2 text-[11px] text-[var(--subtle)] ${m.mine ? "justify-end" : "justify-start"}`}>
                  <span>
                    {timeFmt.format(new Date(m.createdAt))}
                    {m.editedAt && (fr ? " · modifié" : " · edited")}
                    {m.mine && (m.readAt ? " · ✓✓" : " · ✓")}
                  </span>
                  {!editing && (
                    <>
                      <button type="button" onClick={() => copy(m)} className="underline-offset-2 hover:underline">
                        {copiedId === m.id ? (fr ? "Copié" : "Copied") : fr ? "Copier" : "Copy"}
                      </button>
                      {m.mine && (
                        <button type="button" onClick={() => startEdit(m)} className="underline-offset-2 hover:underline">
                          {fr ? "Modifier" : "Edit"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-3">{footer}</div>
    </div>
  );
}
