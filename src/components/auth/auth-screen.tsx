import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { AuthForm } from "@/components/auth/auth-form";
import { getAuthTexts } from "@/i18n/auth";
import type { Locale } from "@/i18n/dictionaries";

/** Mise en page commune de la page d'inscription, FR et EN. */
export function AuthScreen({
  locale,
  initialRole,
  initialCountry,
  initialCity,
}: {
  locale: Locale;
  initialRole: "client" | "provider";
  initialCountry?: string;
  initialCity?: string;
}) {
  const t = getAuthTexts(locale);
  const home = locale === "en" ? "/en" : "/";

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[var(--color-brand-700)] px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(55% 45% at 20% 10%, var(--color-brand-400) 0%, transparent 70%)" }}
        />
        <Link href={home} className="relative text-white">
          <Logo size={30} />
        </Link>

        <div className="relative">
          <h2 className="max-w-sm font-display text-3xl font-bold leading-tight text-white">{t.aside.heading}</h2>
          <ul className="mt-10 space-y-7">
            {t.aside.items.map((a) => (
              <li key={a.title} className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <p className="font-display font-bold text-white">{a.title}</p>
                  <p className="mt-1 max-w-xs text-sm leading-relaxed text-white/70">{a.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} {t.copyright}</p>
      </aside>

      <div className="flex flex-col justify-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link href={home} className="inline-flex text-[var(--color-brand-500)] lg:hidden">
            <Logo size={28} />
          </Link>

          <h1 className="mt-7 text-2xl font-bold sm:text-3xl lg:mt-0">{t.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{t.lead}</p>

          <div className="mt-7">
            <AuthForm locale={locale} initialRole={initialRole} initialCountry={initialCountry} initialCity={initialCity} />
          </div>

          <p className="mt-6 text-center text-sm text-[var(--subtle)]">
            <Link href={home} className="underline underline-offset-4 hover:text-[var(--foreground)]">{t.backHome}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
