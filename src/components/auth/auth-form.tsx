"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KYC_COUNTRIES } from "@/lib/kyc";
import { getAuthTexts, countryNames } from "@/i18n/auth";
import { getCountry } from "@/lib/countries";
import { TurnstileWidget } from "@/components/auth/turnstile";
import type { Locale } from "@/i18n/dictionaries";

type Mode = "signup" | "login";
type Role = "client" | "provider";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20";

function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < 8) return 0;
  let score = 0;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return 1;
  if (score === 2) return 2;
  return 3;
}

const STRENGTH_COLORS = ["bg-red-500", "bg-red-500", "bg-amber-400", "bg-emerald-500"];
const STRENGTH_LABELS: Record<Locale, string[]> = {
  fr: ["", "Faible", "Moyen", "Fort"],
  en: ["", "Weak", "Fair", "Strong"],
};

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

const SUPPORTED = new Set(KYC_COUNTRIES.map((c) => c.code));

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

export function AuthForm({
  locale = "fr",
  initialRole = "client",
  initialCountry,
  initialCity,
}: {
  locale?: Locale;
  initialRole?: Role;
  initialCountry?: string;
  initialCity?: string;
}) {
  const t = getAuthTexts(locale);
  const names = countryNames[locale];
  const router = useRouter();

  // Pays détecté seulement s'il fait partie des pays couverts ; sinon Côte d'Ivoire.
  const defaultCountry = initialCountry && SUPPORTED.has(initialCountry as never) ? initialCountry : "CI";

  const [mode, setMode] = useState<Mode>("signup");
  const [role, setRole] = useState<Role>(initialRole);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [pwValue, setPwValue] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);

    try {
      if (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !token) throw new Error(t.errors.captchaRequired);

      if (mode === "login") {
        // Route Handler : le Set-Cookie est dans la réponse HTTP standard.
        const email = String(form.get("email") ?? "").trim();
        const password = String(form.get("password") ?? "");
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, turnstileToken: token }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? t.errors.login);
        // Le cookie de session vient d'être posé par la route : on navigue
        // puis on rafraîchit pour que le serveur voie la session.
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Inscription par la route serveur : limitation, CAPTCHA et validation côté serveur.
      const firstName = String(form.get("first_name") ?? "").trim();
      const lastName = String(form.get("last_name") ?? "").trim();
      if (!firstName || !lastName) throw new Error(t.errors.nameRequired);

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
          first_name: firstName,
          last_name: lastName,
          phone: String(form.get("phone") ?? "").trim(),
          city: String(form.get("city") ?? "").trim(),
          country_code: String(form.get("country_code") ?? "CI"),
          role,
          turnstileToken: token,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? t.errors.generic);
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.errors.generic;
      setError(
        message.includes("already registered")
          ? t.errors.alreadyRegistered
          : message.includes("Invalid login")
            ? t.errors.invalidCredentials
            : message,
      );
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-5 font-display text-lg font-bold">{t.sent.title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--subtle)]">{t.sent.body}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-7 shadow-[0_18px_44px_-24px_rgba(10,23,16,0.18)] sm:p-8">
      <div className="flex rounded-full bg-[var(--surface)] p-1 text-sm">
        {(["signup", "login"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
              setShowPw(false);
              setPwValue("");
            }}
            className={`flex-1 rounded-full px-4 py-2 font-medium transition-colors ${
              mode === m ? "bg-[var(--background)] shadow-sm" : "text-[var(--subtle)]"
            }`}
          >
            {m === "signup" ? t.tabs.signup : t.tabs.login}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <>
            <fieldset>
              <legend className="text-sm font-medium">{t.roleLegend}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["client", "provider"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    aria-pressed={role === r}
                    className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors ${
                      role === r
                        ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                        : "border-[var(--border)] text-[var(--subtle)] hover:border-[var(--color-brand-300)]"
                    }`}
                  >
                    <span className="text-sm font-semibold">{t.roles[r].label}</span>
                    <span className="mt-0.5 text-xs opacity-70">{t.roles[r].sub}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.fields.firstName} htmlFor="first_name">
                <input id="first_name" name="first_name" required autoComplete="given-name" placeholder={t.placeholders.firstName} className={inputClass} />
              </Field>
              <Field label={t.fields.lastName} htmlFor="last_name">
                <input id="last_name" name="last_name" required autoComplete="family-name" placeholder={t.placeholders.lastName} className={inputClass} />
              </Field>
            </div>

            <Field label={t.fields.phone} htmlFor="phone">
              <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+225 07 00 00 00 00" className={inputClass} />
              <p className="mt-1.5 text-xs text-[var(--subtle)]">
                {role === "provider" ? t.fields.phoneHintProvider : t.fields.phoneHintClient}
              </p>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.fields.country} htmlFor="country_code">
                <select id="country_code" name="country_code" defaultValue={defaultCountry} className={inputClass}>
                  {KYC_COUNTRIES.map((c) => {
                    const meta = getCountry(c.code);
                    const label = meta
                      ? `${meta.flag} ${meta.dialCode} — ${names[c.code] ?? c.name}`
                      : names[c.code] ?? c.name;
                    return <option key={c.code} value={c.code}>{label}</option>;
                  })}
                </select>
              </Field>
              <Field label={t.fields.city} htmlFor="city">
                <input id="city" name="city" autoComplete="address-level2" defaultValue={initialCity ?? ""} placeholder={t.placeholders.city} className={inputClass} />
              </Field>
            </div>
          </>
        )}

        <Field label={t.fields.email} htmlFor="email">
          <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">{t.fields.password}</label>
            {mode === "login" && (
              <Link
                href={locale === "en" ? "/en/auth/forgot-password" : "/auth/forgot-password"}
                className="text-xs text-[var(--color-brand-500)] hover:underline underline-offset-2"
              >
                {t.forgotPassword}
              </Link>
            )}
          </div>
          <div className="relative mt-1.5">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className={`${inputClass} pr-11`}
              value={pwValue}
              onChange={(e) => setPwValue(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 mt-[3px] -translate-y-1/2 text-[var(--subtle)] hover:text-[var(--foreground)] transition-colors"
              aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
          {mode === "signup" && pwValue.length > 0 && (() => {
            const strength = passwordStrength(pwValue);
            const label = STRENGTH_LABELS[locale][strength];
            return (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        strength >= i ? STRENGTH_COLORS[strength] : "bg-[var(--border)]"
                      }`}
                    />
                  ))}
                </div>
                <p className={`mt-1 text-xs ${strength === 3 ? "text-emerald-600" : strength === 2 ? "text-amber-500" : "text-red-500"}`}>
                  {label}
                </p>
              </div>
            );
          })()}
          {mode === "signup" && pwValue.length === 0 && (
            <p className="mt-1.5 text-xs text-[var(--subtle)]">{t.fields.passwordHint}</p>
          )}
        </div>

        <TurnstileWidget onToken={setToken} />

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
          {pending ? t.submit.pending : mode === "signup" ? t.submit.signup : t.submit.login}
        </button>

        <p className="text-center text-xs leading-relaxed text-[var(--subtle)]">
          {t.terms}{" "}
          <Link href={locale === "en" ? "/en/cgu" : "/cgu"} className="underline underline-offset-2">{t.termsLink}</Link>{" "}
          {t.termsAnd}
        </p>
      </form>
    </div>
  );
}
