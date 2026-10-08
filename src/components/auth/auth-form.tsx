"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loginAction } from "@/app/(fr)/auth/actions";

type Mode = "signup" | "login";
type Role = "client" | "provider";

const COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Sénégal" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "BJ", name: "Bénin" },
  { code: "TG", name: "Togo" },
  { code: "NE", name: "Niger" },
  { code: "GW", name: "Guinée-Bissau" },
  { code: "CM", name: "Cameroun" },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)]";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

export function AuthForm({ initialRole = "client" }: { initialRole?: Role }) {
  const [mode, setMode] = useState<Mode>("signup");
  const [role, setRole] = useState<Role>(initialRole);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);

    try {
      if (mode === "login") {
        // Le Server Action signInWithPassword côté serveur → les cookies
        // Set-Cookie sont dans la réponse HTTP avant que le navigateur
        // n'exécute la navigation. window.location.href force un rechargement
        // complet qui envoie ces cookies au serveur dès la première requête.
        const result = await loginAction(form);
        if (result?.error) throw new Error(result.error);
        if (result?.success) {
          window.location.href = "/dashboard";
        }
        return;
      }

      // ── Inscription (signup) via client-side — email + confirmation ──
      const firstName = String(form.get("first_name") ?? "").trim();
      const lastName = String(form.get("last_name") ?? "").trim();
      const phone = String(form.get("phone") ?? "").trim();
      const city = String(form.get("city") ?? "").trim();
      const countryCode = String(form.get("country_code") ?? "CI");
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");

      if (!firstName || !lastName) throw new Error("Le prénom et le nom sont obligatoires.");

      const displayName = `${firstName} ${lastName}`;
      const supabase = createClient();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: firstName,
            last_name: lastName,
            display_name: displayName,
            phone,
            city,
            country_code: countryCode,
            role,
          },
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      setError(
        message.includes("already registered")
          ? "Cette adresse est déjà utilisée. Connectez-vous."
          : message.includes("Invalid login")
            ? "Adresse e-mail ou mot de passe incorrect."
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
        <h2 className="mt-5 font-display text-lg font-bold">Vérifiez votre boîte mail</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--subtle)]">
          Nous vous avons envoyé un lien de confirmation. Cliquez dessus pour activer votre compte
          Toomny.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-7 shadow-[0_18px_44px_-24px_rgba(10,23,16,0.18)] sm:p-8">
      {/* Toggle connexion / inscription */}
      <div className="flex rounded-full bg-[var(--surface)] p-1 text-sm">
        {(["signup", "login"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`flex-1 rounded-full px-4 py-2 font-medium transition-colors ${
              mode === m ? "bg-[var(--background)] shadow-sm" : "text-[var(--subtle)]"
            }`}
          >
            {m === "signup" ? "Créer un compte" : "Se connecter"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <>
            {/* Choix du rôle */}
            <fieldset>
              <legend className="text-sm font-medium">Je viens sur Toomny pour</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  [
                    ["client", "🤝 Recruter", "Trouver des prestataires"],
                    ["provider", "💼 Travailler", "Proposer mes services"],
                  ] as const
                ).map(([r, label, sub]) => (
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
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="mt-0.5 text-xs opacity-70">{sub}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Identité */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom" htmlFor="first_name">
                <input
                  id="first_name"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  placeholder="Kofi"
                  className={inputClass}
                />
              </Field>
              <Field label="Nom" htmlFor="last_name">
                <input
                  id="last_name"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  placeholder="Asante"
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Téléphone */}
            <Field label="Numéro de téléphone" htmlFor="phone">
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+225 07 00 00 00 00"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-[var(--subtle)]">
                Utilisé pour les versements mobile money
                {role === "provider" ? " (requis pour être payé)" : " (optionnel)"}.
              </p>
            </Field>

            {/* Pays + Ville */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pays" htmlFor="country_code">
                <select
                  id="country_code"
                  name="country_code"
                  defaultValue="CI"
                  className={inputClass}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ville" htmlFor="city">
                <input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  placeholder="Abidjan"
                  className={inputClass}
                />
              </Field>
            </div>
          </>
        )}

        {/* Email & mot de passe */}
        <Field label="Adresse e-mail" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </Field>

        <Field label="Mot de passe" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className={inputClass}
          />
          {mode === "signup" && (
            <p className="mt-1.5 text-xs text-[var(--subtle)]">8 caractères minimum.</p>
          )}
        </Field>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-60"
        >
          {pending
            ? "Un instant…"
            : mode === "signup"
              ? "Créer mon compte"
              : "Se connecter"}
        </button>

        <p className="text-center text-xs leading-relaxed text-[var(--subtle)]">
          En créant un compte, vous acceptez nos{" "}
          <a href="/cgu" className="underline underline-offset-2">
            conditions d&apos;utilisation
          </a>{" "}
          et notre politique de confidentialité.
        </p>
      </form>
    </div>
  );
}
