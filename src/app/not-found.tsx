import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="text-sm text-[var(--color-muted)]">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className="text-sm underline underline-offset-4">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
