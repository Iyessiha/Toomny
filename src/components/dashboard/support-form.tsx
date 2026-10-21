"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/dictionaries";
import { sendSupportRequest } from "@/app/(fr)/dashboard/support/actions";

const copy = {
  fr: {
    subject: "Sujet",
    subjectPlaceholder: "Ex. Impossible de publier ma prestation",
    body: "Votre message",
    bodyPlaceholder: "Décrivez votre problème et, si possible, la commande ou la prestation concernée.",
    submit: "Envoyer à l'équipe",
    sending: "Envoi…",
    sent: "Votre demande a bien été envoyée. Nous vous répondons par e-mail.",
  },
  en: {
    subject: "Subject",
    subjectPlaceholder: "E.g. I cannot publish my service",
    body: "Your message",
    bodyPlaceholder: "Describe your issue and, if possible, the order or service concerned.",
    submit: "Send to the team",
    sending: "Sending…",
    sent: "Your request has been sent. We will reply by e-mail.",
  },
} as const;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-brand-500)]";

export function SupportForm({ locale = "fr" }: { locale?: Locale }) {
  const t = copy[locale];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setError(null);
    startTransition(async () => {
      const result = await sendSupportRequest(data);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSent(true);
        form.reset();
        router.refresh();
      }
    });
  }

  if (sent) return <p role="status" className="notice notice-success">{t.sent}</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="sr-subject" className="text-sm font-medium">{t.subject}</label>
        <input id="sr-subject" name="subject" required maxLength={120} placeholder={t.subjectPlaceholder} className={inputClass} />
      </div>
      <div>
        <label htmlFor="sr-body" className="text-sm font-medium">{t.body}</label>
        <textarea id="sr-body" name="body" required maxLength={3000} rows={6} placeholder={t.bodyPlaceholder} className={inputClass} />
      </div>
      {error && <p role="alert" className="notice notice-danger">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">
        {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
