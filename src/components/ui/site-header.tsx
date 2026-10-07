import Link from "next/link";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--border)]">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-[var(--color-brand-500)]" aria-label="Toomny — accueil">
          <Logo size={28} />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/services" className="text-[var(--subtle)] hover:text-[var(--foreground)]">
            Parcourir
          </Link>
          <Link
            href="/auth"
            className="rounded-full bg-[var(--color-brand-500)] px-4 py-1.5 font-medium text-white"
          >
            Se connecter
          </Link>
        </nav>
      </div>
    </header>
  );
}
