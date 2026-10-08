import Link from "next/link";
import type { getPublicPageTexts } from "@/i18n/public-pages";

type CguTexts = ReturnType<typeof getPublicPageTexts>["cgu"];

/** Corps de la page des conditions d'utilisation, commun aux deux langues. */
export function CguBody({ t }: { t: CguTexts }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-bold">{t.title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--subtle)]">{t.body}</p>
      <p className="mt-8 text-sm">
        <Link href="/" className="underline underline-offset-4">{t.home}</Link>
      </p>
    </main>
  );
}
