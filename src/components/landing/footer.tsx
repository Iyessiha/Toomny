import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";
import { socialLinks } from "@/lib/social";

export function Footer({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).footer;
  const COLUMNS = t.columns;

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <span className="inline-flex text-[var(--color-brand-500)]">
              <Logo size={28} />
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--subtle)]">{t.blurb}</p>
            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {socialLinks().map((s) => (
                <li key={s.label}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--subtle)] transition-colors hover:text-[var(--color-brand-600)]"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-display text-sm font-bold">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-[var(--subtle)] transition-colors hover:text-[var(--foreground)]">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--subtle)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Toomny by MonWe Infinity LLC</p>
          <p>{t.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
