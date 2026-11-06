"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { replyToInquiry, draftInquiryReplyWithAi } from "@/app/(fr)/demandes/actions";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import type { Locale } from "@/i18n/dictionaries";

export function InquiryReplyForm({
  toId,
  serviceId,
  locale = "fr",
  aiAvailable = false,
}: {
  toId: string;
  serviceId: string | null;
  locale?: Locale;
  /** Prestataire avec un plan payant : affiche le brouillon IA. */
  aiAvailable?: boolean;
}) {
  const t = getMarketplaceTexts(locale).inquiries;
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [language, setLanguage] = useState<"auto" | "fr" | "en">("auto");
  const fr = locale !== "en";

  /** Pré-remplit le champ avec un brouillon. Rien n'est envoyé : le prestataire relit. */
  async function onDraft() {
    setDrafting(true);
    setError(null);
    const result = await draftInquiryReplyWithAi({ toId, serviceId, language });
    setDrafting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if (ref.current) {
      ref.current.value = result.text;
      ref.current.focus();
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = ref.current?.value ?? "";
    setPending(true);
    setError(null);
    const result = await replyToInquiry({ toId, serviceId, message });
    setPending(false);
    if ("error" in result) {
      setError(result.error ?? null);
      return;
    }
    if (ref.current) ref.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {aiAvailable && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[var(--subtle)]">
            {fr ? "Le brouillon IA est à relire avant envoi." : "The AI draft must be reviewed before sending."}
          </p>
          <div className="flex items-center gap-2">
          <select
            aria-label={fr ? "Langue du brouillon" : "Draft language"}
            value={language}
            onChange={(e) => setLanguage(e.target.value as "auto" | "fr" | "en")}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs"
          >
            <option value="auto">{fr ? "Langue du client" : "Client's language"}</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
          <button
            type="button"
            onClick={onDraft}
            disabled={drafting || pending}
            className="btn-ghost btn-sm disabled:opacity-60"
          >
            {drafting ? (fr ? "Rédaction…" : "Drafting…") : fr ? "Rédiger avec l'IA" : "Draft with AI"}
          </button>
          </div>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          required
          rows={2}
          maxLength={1000}
          placeholder={t.replyPlaceholder}
          aria-label={t.reply}
          className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-text-2)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex-none rounded-full btn-fill px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? t.replying : t.reply}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
