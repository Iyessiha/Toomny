"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20";

const t = {
  title: "Nouveau mot de passe",
  lead: "Choisissez un mot de passe d'au moins 8 caractères.",
  newPassword: "Nouveau mot de passe",
  submit: "Enregistrer",
  pending: "Enregistrement…",
  success: {
    title: "Mot de passe mis à jour",
    body: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
    cta: "Se connecter",
  },
  errors: {
    invalid: "Ce lien est expiré ou invalide. Recommencez depuis la page de connexion.",
    minLength: "8 caractères minimum.",
    generic: "Une erreur est survenue. Réessayez.",
  },
  home: "/",
  loginHref: "/auth",
};

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!code) { setInvalid(true); return; }
    // Échanger le code PKCE contre une session active
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) setInvalid(true);
      else setReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { setError(t.errors.minLength); return; }
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setError(t.errors.generic);
    } else {
      setSuccess(true);
    }
    setPending(false);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href={t.home} className="inline-flex text-[var(--color-brand-500)] mb-10">
          <Logo size={28} />
        </Link>

        {invalid && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/40">
            <p className="text-sm leading-relaxed text-red-700 dark:text-red-400">{t.errors.invalid}</p>
            <Link href={t.loginHref} className="mt-4 inline-block text-sm text-[var(--color-brand-500)] hover:underline underline-offset-2">
              ← Retour à la connexion
            </Link>
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 13 4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-bold">{t.success.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{t.success.body}</p>
            <button
              onClick={() => router.push(t.loginHref)}
              className="mt-6 w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.01] active:scale-95"
            >
              {t.success.cta}
            </button>
          </div>
        )}

        {!invalid && !success && (
          <>
            <h1 className="text-2xl font-bold sm:text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{t.lead}</p>

            <form
              onSubmit={onSubmit}
              className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-7 shadow-[0_18px_44px_-24px_rgba(10,23,16,0.18)] sm:p-8 space-y-4"
            >
              {!ready && !invalid && (
                <p className="text-center text-sm text-[var(--subtle)]">Vérification du lien…</p>
              )}

              {ready && (
                <div>
                  <label htmlFor="password" className="text-sm font-medium">{t.newPassword}</label>
                  <div className="relative mt-1.5">
                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className={`${inputClass} pr-11`}
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 mt-[3px] -translate-y-1/2 text-[var(--subtle)] hover:text-[var(--foreground)] transition-colors"
                      aria-label={showPw ? "Masquer" : "Afficher"}
                    >
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                  <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {ready && (
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-60"
                >
                  {pending ? t.pending : t.submit}
                </button>
              )}
            </form>
          </>
        )}
      </div>
    </main>
  );
}
