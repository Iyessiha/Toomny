"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
      <p className="text-sm text-[var(--color-muted)]">
        Réessayez dans un instant. Si le problème persiste, contactez-nous.
      </p>
      <button onClick={reset} className="text-sm underline underline-offset-4">
        Réessayer
      </button>
    </main>
  );
}
