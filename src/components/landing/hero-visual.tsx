"use client";

import Image from "next/image";
import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

type Mode = "client" | "provider";

// Constantes partagées pour le style dark-card cohérent avec pricing/boost
const CARD_BG    = "bg-[rgba(11,25,18,0.90)]";
const CARD_BORDER = "border-[rgba(255,255,255,0.08)]";
const DIVIDER    = "divide-[rgba(255,255,255,0.08)]";
const INNER_BG   = "bg-[rgba(255,255,255,0.06)]";
const SUBTLE     = "text-white/55";

function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" aria-hidden>
          <path
            fill={i < n ? "#FFCB00" : "rgba(255,255,255,0.2)"}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"
          />
        </svg>
      ))}
    </div>
  );
}

/* ── Visual client : carte service + mini-cards en stagger ── */
function ClientVisual({ t }: { t: ReturnType<typeof getLanding>["visual"] }) {
  return (
    <div className="relative select-none" aria-hidden>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(5px); }
        }
        .float-a { animation: floatA 3.6s ease-in-out infinite; }
        .float-b { animation: floatB 4.2s ease-in-out infinite; }
        .slide-in-1 { animation: slideInRight 0.5s ease both 0.1s; }
        .slide-in-2 { animation: slideInRight 0.5s ease both 0.28s; }
        .slide-in-3 { animation: slideInRight 0.5s ease both 0.46s; }
      `}</style>

      {/* Badge flottant haut-droite : identité vérifiée */}
      <div className={`float-b absolute -right-4 -top-3 z-20 hidden items-center gap-2 rounded-2xl border ${CARD_BORDER} ${CARD_BG} px-3.5 py-2.5 shadow-[var(--shadow-lg)] sm:flex`}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(34,197,94,0.15)] text-green-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold text-green-400">{t.verified}</p>
          <p className={`text-[10px] ${SUBTLE}`}>KYC approuvé</p>
        </div>
      </div>

      {/* Carte service principale */}
      <div className={`slide-in-1 w-[300px] overflow-hidden rounded-3xl border ${CARD_BORDER} ${CARD_BG} shadow-[var(--shadow-xl)] sm:w-[340px]`}>
        <div className="relative flex h-36 items-end p-4">
          <Image src="/images/hero-provider.jpg" alt="" fill className="object-cover object-top" priority sizes="340px" />
          <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(107,70,193,0.55) 0%, rgba(8,145,178,0.7) 100%)" }} />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
            <svg viewBox="0 0 120 120" width="100" height="100" fill="none">
              <circle cx="43" cy="22" r="11.5" fill="white"/>
              <circle cx="77" cy="22" r="11.5" fill="white"/>
              <g fill="none" stroke="white" strokeWidth="9" strokeLinecap="butt">
                <path d="M74 50C62 34 32 37 29 58C26 79 47 87 54 100"/>
                <path d="M46 50C58 34 88 37 91 58C94 79 73 87 66 100"/>
              </g>
            </svg>
          </div>
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-sm">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r="3.5"/><circle cx="6.5" cy="17.5" r="3.5"/><path d="m4 4 16 16"/>
            </svg>
            <span className="text-[10px] font-semibold text-white">Design graphique</span>
          </div>
          <div className="absolute right-4 top-4 rounded-full bg-[#FFCB00] px-2.5 py-0.5">
            <span className="text-[10px] font-bold text-amber-900">✦ Vedette</span>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold leading-tight text-white drop-shadow">{t.serviceTitle}</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] px-4 py-3.5`}>
          <div className="relative">
            <div className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-[rgba(255,255,255,0.08)]`}>
              <Image src="/images/hero-provider.jpg" alt="Awa Konaté" fill className="object-cover object-top" sizes="40px" />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[rgba(255,255,255,0.08)] bg-green-500 text-[8px] text-white`}>✓</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-white">Awa Konaté</p>
              <span className="text-[11px]">🇨🇮</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Stars n={5} />
              <span className={`text-[11px] ${SUBTLE}`}>4.9 · 47 avis</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-[10px] ${SUBTLE}`}>Délai</p>
            <p className="text-xs font-bold text-white">5 jours</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div>
            <p className={`text-[10px] ${SUBTLE}`}>À partir de</p>
            <p className="font-display text-lg font-extrabold text-[#22c55e]">
              150 000 <span className={`text-sm font-semibold ${SUBTLE}`}>FCFA</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--color-brand-500)] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[var(--color-brand-500)]/25">
            Commander
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.08)] px-4 py-3">
          <div className={`flex items-center justify-between text-[10px] ${SUBTLE} mb-1.5`}>
            <span className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              {t.escrowBadge}
            </span>
            <span className="font-semibold text-[#22c55e]">{t.step}</span>
          </div>
          <div className={`h-1.5 w-full overflow-hidden rounded-full ${INNER_BG}`}>
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-600)]" />
          </div>
        </div>
      </div>

      {/* Mini-cards résultats de recherche en stagger */}
      <div className={`slide-in-2 absolute -right-16 top-[60px] z-30 hidden w-48 items-center gap-2.5 rounded-2xl border ${CARD_BORDER} ${CARD_BG} px-3 py-2.5 shadow-[var(--shadow-lg)] sm:flex`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 text-sm font-bold">DK</div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">Dev Kouyaté</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Stars n={5} />
            <span className={`text-[10px] ${SUBTLE}`}>4.8</span>
          </div>
        </div>
        <p className="shrink-0 text-[11px] font-bold text-[#22c55e]">75k</p>
      </div>

      <div className={`slide-in-3 absolute -right-16 top-[142px] z-30 hidden w-48 items-center gap-2.5 rounded-2xl border ${CARD_BORDER} ${CARD_BG} px-3 py-2.5 shadow-[var(--shadow-lg)] sm:flex`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 text-sm font-bold">MB</div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">Marie Bamba</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Stars n={4} />
            <span className={`text-[10px] ${SUBTLE}`}>4.6</span>
          </div>
        </div>
        <p className="shrink-0 text-[11px] font-bold text-[#22c55e]">60k</p>
      </div>

      {/* Badge flottant bas-gauche */}
      <div className={`float-a absolute -bottom-4 -left-6 z-20 w-52 rounded-2xl border ${CARD_BORDER} ${CARD_BG} p-3.5 shadow-[var(--shadow-lg)] sm:-left-10`}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white shadow-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-display text-xs font-bold text-[#22c55e]">{t.payoutTitle}</p>
            <p className={`truncate text-[10px] ${SUBTLE}`}>{t.payoutMeta}</p>
          </div>
        </div>
        <div className={`mt-2.5 flex items-center gap-1.5 rounded-xl ${INNER_BG} px-2.5 py-1.5`}>
          <span className="h-2 w-2 rounded-full bg-[#FF8A00]" />
          <span className={`text-[10px] font-semibold ${SUBTLE}`}>Wave · Mobile Money</span>
        </div>
      </div>
    </div>
  );
}

/* ── Visual prestataire : dashboard revenus + notification commande ── */
function ProviderVisual({ locale }: { locale: Locale }) {
  const isEn = locale === "en";

  return (
    <div className="relative select-none" aria-hidden>
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(5px); }
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .float-a { animation: floatA 3.6s ease-in-out infinite; }
        .float-b { animation: floatB 4.2s ease-in-out infinite; }
        .pulse-ring { animation: pulseRing 2s ease-out infinite; }
        .count-up-1 { animation: countUp 0.5s ease both 0.2s; }
        .count-up-2 { animation: countUp 0.5s ease both 0.35s; }
        .count-up-3 { animation: countUp 0.5s ease both 0.5s; }
        .slide-up-1 { animation: slideUp 0.45s ease both 0.15s; }
        .slide-up-2 { animation: slideUp 0.45s ease both 0.3s; }
        .slide-up-3 { animation: slideUp 0.45s ease both 0.45s; }
        .slide-up-4 { animation: slideUp 0.45s ease both 0.6s; }
      `}</style>

      {/* Badge flottant haut-droite : nouvelle commande pulsante */}
      <div className={`float-b absolute -right-4 -top-3 z-20 hidden items-center gap-2 rounded-2xl border ${CARD_BORDER} ${CARD_BG} px-3.5 py-2.5 shadow-[var(--shadow-lg)] sm:flex`}>
        <div className="pulse-ring flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-500 text-white">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold text-green-400">{isEn ? "New order!" : "Nouvelle commande !"}</p>
          <p className={`text-[10px] ${SUBTLE}`}>{isEn ? "2 min ago" : "Il y a 2 min"}</p>
        </div>
      </div>

      {/* Dashboard principal */}
      <div className={`w-[300px] overflow-hidden rounded-3xl border ${CARD_BORDER} ${CARD_BG} shadow-[var(--shadow-xl)] sm:w-[340px]`}>

        {/* Header dashboard */}
        <div className={`slide-up-1 flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-4 py-3.5`}>
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${SUBTLE}`}>{isEn ? "Dashboard" : "Tableau de bord"}</p>
            <p className="text-sm font-bold text-white">{isEn ? "Your performance" : "Vos performances"}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[rgba(34,197,94,0.15)] px-2.5 py-1 text-[11px] font-bold text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {isEn ? "Active" : "Actif"}
          </div>
        </div>

        {/* Stats 3 colonnes */}
        <div className={`grid grid-cols-3 ${DIVIDER} divide-x border-b border-[rgba(255,255,255,0.08)]`}>
          <div className="count-up-1 px-3 py-3.5 text-center">
            <p className="font-display text-base font-extrabold text-[#22c55e]">347k</p>
            <p className={`mt-0.5 text-[10px] ${SUBTLE}`}>FCFA</p>
            <p className="text-[10px] font-semibold text-white">{isEn ? "Revenue" : "Revenus"}</p>
          </div>
          <div className="count-up-2 px-3 py-3.5 text-center">
            <p className="font-display text-base font-extrabold text-white">12</p>
            <p className={`mt-0.5 text-[10px] ${SUBTLE}`}>{isEn ? "total" : "total"}</p>
            <p className="text-[10px] font-semibold text-white">{isEn ? "Orders" : "Commandes"}</p>
          </div>
          <div className="count-up-3 px-3 py-3.5 text-center">
            <p className="font-display text-base font-extrabold text-amber-400">4.9</p>
            <div className="mt-0.5 flex justify-center">
              <Stars n={5} />
            </div>
            <p className="text-[10px] font-semibold text-white">{isEn ? "Rating" : "Note"}</p>
          </div>
        </div>

        {/* Barre revenus mensuelle */}
        <div className="slide-up-2 px-4 py-3.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-white">{isEn ? "This month" : "Ce mois"}</p>
            <p className="text-[11px] font-bold text-green-400">+23%</p>
          </div>
          <div className="flex items-end gap-1 h-10">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background: i === 5
                    ? "var(--color-brand-500)"
                    : "rgba(255,255,255,0.08)",
                  animation: `slideUp 0.4s ease both ${0.1 + i * 0.06}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Dernière commande */}
        <div className="slide-up-3 border-t border-[rgba(255,255,255,0.08)] px-4 py-3.5">
          <p className={`mb-2 text-[10px] font-semibold uppercase tracking-widest ${SUBTLE}`}>
            {isEn ? "Latest order" : "Dernière commande"}
          </p>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(34,197,94,0.12)] text-[#22c55e] text-xs font-bold">
              SK
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-white">{isEn ? "Logo redesign" : "Refonte logo"}</p>
              <p className={`text-[10px] ${SUBTLE}`}>Seydou Konaté</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-bold text-[#22c55e]">85 000</p>
              <p className={`text-[9px] ${SUBTLE}`}>FCFA</p>
            </div>
          </div>
        </div>

        {/* Escrow progress */}
        <div className="slide-up-4 border-t border-[rgba(255,255,255,0.08)] px-4 py-3">
          <div className={`flex items-center justify-between text-[10px] ${SUBTLE} mb-1.5`}>
            <span className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              {isEn ? "Funds secured" : "Fonds sécurisés"}
            </span>
            <span className="font-semibold text-[#22c55e]">{isEn ? "Delivery" : "Livraison"}</span>
          </div>
          <div className={`h-1.5 w-full overflow-hidden rounded-full ${INNER_BG}`}>
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-600)]" />
          </div>
        </div>
      </div>

      {/* Badge flottant bas-gauche : versement reçu */}
      <div className={`float-a absolute -bottom-4 -left-6 z-20 w-52 rounded-2xl border ${CARD_BORDER} ${CARD_BG} p-3.5 shadow-[var(--shadow-lg)] sm:-left-10`}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-display text-xs font-bold text-[#22c55e]">
              {isEn ? "Payment received" : "Paiement reçu"}
            </p>
            <p className={`truncate text-[10px] ${SUBTLE}`}>85 000 FCFA</p>
          </div>
        </div>
        <div className={`mt-2.5 flex items-center gap-1.5 rounded-xl ${INNER_BG} px-2.5 py-1.5`}>
          <span className="h-2 w-2 rounded-full bg-[#FF8A00]" />
          <span className={`text-[10px] font-semibold ${SUBTLE}`}>Wave · Mobile Money</span>
        </div>
      </div>
    </div>
  );
}

export function HeroVisual({ locale = "fr", mode = "client" }: { locale?: Locale; mode?: Mode }) {
  const t = getLanding(locale).visual;

  if (mode === "provider") {
    return <ProviderVisual locale={locale} />;
  }

  return <ClientVisual t={t} />;
}
