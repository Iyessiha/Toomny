import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";

export default async function NotFound() {
  const t = getPublicPageTexts(await visitorLocale()).notFound;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-[var(--color-brand-500)]">
        <Logo size={40} withWordmark={false} />
      </span>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <p className="text-sm text-[var(--subtle)]">{t.body}</p>
      <Link href="/" className="text-sm text-[var(--color-brand-600)] underline underline-offset-4">
        {t.home}
      </Link>
    </main>
  );
}
