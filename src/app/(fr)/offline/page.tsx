export const metadata = { title: "Hors ligne · Toomny", robots: { index: false } };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-brand-50)] border border-[var(--color-brand-200)]">
        <svg className="h-10 w-10 text-[var(--color-brand-500)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7a9.533 9.533 0 01-1.43-2.847M9.879 9.878a3 3 0 004.242 4.242" />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-bold">Vous êtes hors ligne</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--subtle)]">
        Vérifiez votre connexion internet et réessayez. Les pages déjà visitées restent accessibles depuis le cache.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 rounded-full bg-[var(--color-brand-500)] px-8 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
      >
        Réessayer
      </button>
    </main>
  );
}
