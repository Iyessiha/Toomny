"use client";

import { useState, useTransition } from "react";
import { analyzeServiceListing, rejectService } from "@/app/(fr)/admin/services/actions";
import type { ReviewVerdict } from "@/lib/service-review";

const copy = {
  fr: {
    title: "Analyse de la prestation",
    intro: "L'assistant relit le texte et les contrôles. Rien n'est modifié tant que vous ne validez pas.",
    run: "Analyser avec l'IA",
    running: "Analyse…",
    approve: "Aucun point relevé : vous pouvez valider et publier la prestation.",
    reject: "Points à corriger, à envoyer au prestataire :",
    refuse: "Refuser et notifier le prestataire",
    messageLabel: "Message au prestataire (modifiable)",
    error: "L'analyse a échoué. Réessayez.",
  },
  en: {
    title: "Service analysis",
    intro: "The assistant reviews the text and the checks. Nothing changes until you decide.",
    run: "Analyze with AI",
    running: "Analyzing…",
    approve: "No issue found: you can approve and publish the service.",
    reject: "Points to correct, to send to the provider:",
    refuse: "Refuse and notify the provider",
    messageLabel: "Message to the provider (editable)",
    error: "The analysis failed. Please try again.",
  },
} as const;

export function ServiceAiReview({
  serviceId,
  locale,
  refuseAction,
}: {
  serviceId: string;
  locale: "fr" | "en";
  refuseAction: (formData: FormData) => Promise<void>;
}) {
  const t = copy[locale];
  const [result, setResult] = useState<ReviewVerdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    startTransition(async () => {
      const out = await analyzeServiceListing(serviceId);
      if ("error" in out) {
        setError(out.error || t.error);
        setResult(null);
      } else setResult(out);
    });
  }

  const suggestedMessage = result?.points.map((p) => `• ${p.message}`).join("\n") ?? "";

  return (
    <section className="space-y-4">
      <p className="text-sm text-[var(--subtle)]">{t.intro}</p>
      <button type="button" onClick={run} disabled={pending} className="btn-primary btn-sm">
        {pending ? t.running : t.run}
      </button>
      {error && <p role="alert" className="text-sm text-[var(--tone-danger-fg)]">{error}</p>}

      {result && result.verdict === "approve" && (
        <p role="status" className="rounded-xl bg-[var(--tone-success-bg)] p-3 text-sm text-[var(--tone-success-fg)]">{t.approve}</p>
      )}

      {result && result.verdict === "reject" && (
        <form action={refuseAction} className="space-y-3">
          <input type="hidden" name="serviceId" value={serviceId} />
          {result.points.map((p) => (
            <input key={p.reason} type="hidden" name="reasons" value={p.reason} />
          ))}
          <p className="text-sm font-semibold">{t.reject}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {result.points.map((p) => (
              <li key={p.reason}>{p.message}</li>
            ))}
          </ul>
          <div>
            <label className="label" htmlFor="ai-refuse-message">{t.messageLabel}</label>
            <textarea
              id="ai-refuse-message"
              name="message"
              rows={4}
              maxLength={1000}
              defaultValue={suggestedMessage}
              key={suggestedMessage}
              className="input w-full"
            />
          </div>
          <button type="submit" className="btn-danger btn-sm">{t.refuse}</button>
        </form>
      )}
    </section>
  );
}
