import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-[var(--color-brand-500)]">
        <Logo size={40} withWordmark={false} />
      </span>
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="text-sm text-[var(--subtle)]">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className="text-sm text-[var(--color-brand-600)] underline underline-offset-4">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
