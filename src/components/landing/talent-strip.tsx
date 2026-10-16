"use client";

import type { Locale } from "@/i18n/dictionaries";

const TALENTS = [
  { init: "AD", name: "Amadou D.", spec: "Design graphique",    loc: "🇸🇳 Dakar",   stars: 5, badge: "Pro",    grad: "linear-gradient(135deg,#064e3b,#22c55e)" },
  { init: "KO", name: "Kojo O.",   spec: "Développement web",  loc: "🇬🇭 Accra",   stars: 5, badge: "Expert", grad: "linear-gradient(135deg,#1e1b4b,#3b82f6)" },
  { init: "FM", name: "Fatim M.",  spec: "Vidéo & Motion",     loc: "🇨🇮 Abidjan", stars: 4, badge: "Pro",    grad: "linear-gradient(135deg,#4c0519,#e11d48)" },
  { init: "BT", name: "Boubacar T.", spec: "Marketing digital", loc: "🇲🇱 Bamako", stars: 5, badge: "Expert", grad: "linear-gradient(135deg,#7c2d12,#f97316)" },
  { init: "NC", name: "Nana C.",   spec: "Photographie",       loc: "🇧🇫 Ouaga",   stars: 5, badge: "Pro",    grad: "linear-gradient(135deg,#1f2937,#6b7280)" },
  { init: "SO", name: "Seydou O.", spec: "Rédaction & SEO",    loc: "🇸🇳 Dakar",   stars: 4, badge: "Pro",    grad: "linear-gradient(135deg,#134e4a,#0d9488)" },
  { init: "EK", name: "Efua K.",   spec: "Musique & Audio",    loc: "🇬🇭 Kumasi",  stars: 5, badge: "Expert", grad: "linear-gradient(135deg,#4c1d95,#7c3aed)" },
  { init: "DL", name: "Daba L.",   spec: "UI/UX Design",       loc: "🇨🇮 Abidjan", stars: 5, badge: "Top",    grad: "linear-gradient(135deg,#1e3a5f,#0ea5e9)" },
  { init: "MN", name: "Moussa N.", spec: "Comptabilité",       loc: "🇲🇱 Bamako",  stars: 4, badge: "Pro",    grad: "linear-gradient(135deg,#1f2937,#374151)" },
  { init: "IA", name: "Idriss A.", spec: "Dev Mobile",         loc: "🇧🇯 Cotonou", stars: 5, badge: "Expert", grad: "linear-gradient(135deg,#0c4a6e,#0369a1)" },
  { init: "AR", name: "Aminata R.", spec: "Animation 2D/3D",   loc: "🇸🇳 Dakar",   stars: 5, badge: "Top",    grad: "linear-gradient(135deg,#3b0764,#9333ea)" },
  { init: "YD", name: "Yaw D.",    spec: "Business & Conseil", loc: "🇬🇭 Accra",   stars: 4, badge: "Pro",    grad: "linear-gradient(135deg,#0f766e,#0d9488)" },
];

const BADGE_CLASSES: Record<string, string> = {
  Pro:    "bg-[rgba(34,197,94,0.12)] text-[#22c55e] border border-[rgba(34,197,94,0.2)]",
  Expert: "bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)]",
  Top:    "bg-[rgba(139,92,246,0.12)] text-[#a78bfa] border border-[rgba(139,92,246,0.2)]",
};

function TalentCard({ t }: { t: typeof TALENTS[0] }) {
  return (
    <div className="flex-shrink-0 w-48 rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(34,197,94,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(34,197,94,0.08)]">
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[rgba(34,197,94,0.18)] rounded-tr-2xl" />

      {/* Avatar */}
      <div className="flex items-start gap-2.5 mb-2.5">
        <div
          className="relative w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: t.grad }}
        >
          {t.init}
          {/* Online dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22c55e] border-2 border-[var(--background)]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[var(--foreground)] truncate">{t.name}</p>
          <p className="text-[11px] text-[var(--subtle)] truncate">{t.spec}</p>
        </div>
      </div>

      {/* Stars */}
      <div className="flex items-center justify-between">
        <span className="text-[#f59e0b] text-[11px]">{"★".repeat(t.stars)}{"☆".repeat(5 - t.stars)}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${BADGE_CLASSES[t.badge] ?? ""}`}>
          {t.badge}
        </span>
      </div>

      {/* Country */}
      <p className="mt-1.5 text-[11px] text-[var(--subtle)]">{t.loc}</p>
    </div>
  );
}

export function TalentStrip({ locale = "fr" }: { locale?: Locale }) {
  const label = locale === "fr"
    ? "Talents vérifiés · disponibles maintenant"
    : "Verified talents · available now";

  const doubled = [...TALENTS, ...TALENTS];

  return (
    <div className="relative border-t border-[rgba(34,197,94,0.07)] border-b border-[rgba(34,197,94,0.07)] bg-black/20 overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-28 z-10 bg-gradient-to-r from-[var(--background)] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-28 z-10 bg-gradient-to-l from-[var(--background)] to-transparent" />

      {/* Label */}
      <div className="flex items-center justify-center gap-3 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[rgba(34,197,94,0.35)]">
        <span className="h-px w-24 bg-gradient-to-r from-transparent to-[rgba(34,197,94,0.15)]" />
        <span className="online-dot" />
        {label}
        <span className="online-dot" />
        <span className="h-px w-24 bg-gradient-to-l from-transparent to-[rgba(34,197,94,0.15)]" />
      </div>

      {/* Scrolling track */}
      <div className="overflow-hidden pb-5">
        <div className="talent-track">
          {doubled.map((t, i) => (
            <TalentCard key={i} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
