import type { Locale } from "@/i18n/dictionaries";

const ITEMS = {
  fr: [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      ),
      label: "Prestataires vérifiés KYC",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect width="18" height="14" x="3" y="7" rx="2"/>
          <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
          <circle cx="12" cy="13" r="2"/>
        </svg>
      ),
      label: "Paiement conservé jusqu'à livraison",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
        </svg>
      ),
      label: "0 % de commission côté client",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect width="7" height="12" x="2" y="7" rx="1"/>
          <path d="M16 6v12M11 9v6M21 8v8"/>
        </svg>
      ),
      label: "Versement Wave · Orange · MTN · Moov",
    },
  ],
  en: [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      ),
      label: "KYC-verified providers",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect width="18" height="14" x="3" y="7" rx="2"/>
          <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
          <circle cx="12" cy="13" r="2"/>
        </svg>
      ),
      label: "Payment held until delivery",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
        </svg>
      ),
      label: "0% client fee",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect width="7" height="12" x="2" y="7" rx="1"/>
          <path d="M16 6v12M11 9v6M21 8v8"/>
        </svg>
      ),
      label: "Wave · Orange · MTN · Moov payouts",
    },
  ],
};

export function TrustBar({ locale = "fr" }: { locale?: Locale }) {
  const items = ITEMS[locale];

  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul
          data-reveal
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-4 sm:flex-nowrap sm:divide-x sm:divide-[var(--border)] sm:gap-0 sm:py-3.5"
        >
          {items.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 text-xs font-medium text-[var(--subtle)] sm:px-8 sm:first:pl-0 sm:last:pr-0"
            >
              <span className="shrink-0 text-[var(--color-brand-500)]">{item.icon}</span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
