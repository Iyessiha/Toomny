"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const t = {
  fr: {
    title: "Mot de passe oublié ?",
    lead: "Entrez votre adresse e-mail, nous vous enverrons un lien pour choisir un nouveau mot de passe.",
    email: "Adresse e-mail",
    submit: "Envoyer le lien",
    pending: "Envoi…",
    sent: {
      title: "Lien envoyé",
      body: "Si cette adresse existe dans notre base, vous recevrez un e-mail dans quelques minutes. Pensez à vérifier vos spams.",
    },
    error: "Une erreur est survenue. Réessayez.",
    backToLogin: "← Retour à la connexion",
    home: "/",
    loginHref: "/auth",
  },
};

export default function ForgotPasswordPage() {
  const texts = t.fr;
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError(texts.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href={texts.home} className="inline-flex text-[var(--color-brand-500)] mb-10">
          <Logo size={28} />
        </Link>

        {sent ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 13 4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-bold">{texts.sent.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{texts.sent.body}</p>
            <Link
              href={texts.loginHref}
              className="mt-6 inline-block text-sm text-[var(--color-brand-500)] hover:underline underline-offset-2"
            >
              {texts.backToLogin}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold sm:text-3xl">{texts.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{texts.lead}</p>

            <form onSubmit={onSubmit} className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-7 shadow-[0_18px_44px_-24px_rgba(10,23,16,0.18)] sm:p-8 space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium">{texts.email}</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20"
                />
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                  <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-60"
              >
                {pending ? texts.pending : texts.submit}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--subtle)]">
              <Link href={texts.loginHref} className="text-[var(--color-brand-500)] hover:underline underline-offset-2">
                {texts.backToLogin}
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
