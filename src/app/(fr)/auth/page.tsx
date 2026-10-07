import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Rejoignez Toomny : recrutez un prestataire vérifié, ou vendez vos services et soyez payé sous 24 h en mobile money.",
};

const ARGUMENTS = [
  {
    title: "Payé sous 24 h",
    body: "Directement sur votre Wave ou votre Orange Money. Sans société américaine, sans Payoneer.",
  },
  {
    title: "Vous gardez 90 %",
    body: "10 % de commission côté prestataire, rien côté client. Publier et postuler sont gratuits.",
  },
  {
    title: "Fonds bloqués",
    body: "L'argent du client est conservé par un établissement agréé jusqu'à la validation de la livraison.",
  },
];

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Colonne argumentaire — masquée sur mobile, où le formulaire prime. */}
      <aside className="relative hidden overflow-hidden bg-[var(--color-brand-700)] px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(55% 45% at 20% 10%, var(--color-brand-400) 0%, transparent 70%)",
          }}
        />
        <Link href="/" className="relative text-white">
          <Logo size={30} />
        </Link>

        <div className="relative">
          <h2 className="max-w-sm font-display text-3xl font-bold leading-tight text-white">
            Travailler ensemble, grandir ensemble
          </h2>
          <ul className="mt-10 space-y-7">
            {ARGUMENTS.map((a) => (
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

        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Toomny</p>
      </aside>

      {/* Colonne formulaire */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="inline-flex text-[var(--color-brand-500)] lg:hidden">
            <Logo size={28} />
          </Link>

          <h1 className="mt-7 text-2xl font-bold sm:text-3xl lg:mt-0">
            Rejoignez Toomny
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">
            Quelques secondes suffisent. Vous pourrez compléter votre profil ensuite.
          </p>

          <div className="mt-7">
            <AuthForm initialRole={role === "provider" ? "provider" : "client"} />
          </div>

          <p className="mt-6 text-center text-sm text-[var(--subtle)]">
            <Link href="/" className="underline underline-offset-4 hover:text-[var(--foreground)]">
              Retour à l&apos;accueil
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
