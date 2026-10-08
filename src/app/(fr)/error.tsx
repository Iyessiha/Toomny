"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import { getPublicPageTexts } from "@/i18n/public-pages";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = getPublicPageTexts(useLanguage().locale).error;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <p className="text-sm text-[var(--color-muted)]">{t.body}</p>
      <button onClick={reset} className="text-sm underline underline-offset-4">
        {t.retry}
      </button>
    </main>
  );
}
