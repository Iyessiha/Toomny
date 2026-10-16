import type { Locale } from "@/i18n/dictionaries";
import { getBoostedProviders, type BoostedProvider } from "@/lib/catalog";

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return "";
  const [a, b] = code.toUpperCase().split("");
  return String.fromCodePoint(0x1f1e0 + a.charCodeAt(0) - 65) +
         String.fromCodePoint(0x1f1e0 + b.charCodeAt(0) - 65);
}

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  elite:  { label: "Elite",  cls: "bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)]" },
  pro:    { label: "Pro",    cls: "bg-[rgba(34,197,94,0.12)] text-[#22c55e] border border-[rgba(34,197,94,0.2)]" },
  expert: { label: "Expert", cls: "bg-[rgba(139,92,246,0.12)] text-[#a78bfa] border border-[rgba(139,92,246,0.2)]" },
};

const GRADIENTS = [
  "linear-gradient(135deg,#064e3b,#22c55e)",
  "linear-gradient(135deg,#1e1b4b,#3b82f6)",
  "linear-gradient(135deg,#4c0519,#e11d48)",
  "linear-gradient(135deg,#7c2d12,#f97316)",
  "linear-gradient(135deg,#134e4a,#0d9488)",
  "linear-gradient(135deg,#4c1d95,#7c3aed)",
  "linear-gradient(135deg,#1e3a5f,#0ea5e9)",
  "linear-gradient(135deg,#3b0764,#9333ea)",
];

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function TalentCard({ p, idx }: { p: BoostedProvider; idx: number }) {
  const badge = TIER_BADGE[p.tier] ?? TIER_BADGE.pro;
  const grad = GRADIENTS[idx % GRADIENTS.length];
  const stars = Math.round(p.rating_avg ?? 4);
  const flag = countryFlag(p.country_code);

  return (
    <div className="flex-shrink-0 w-52 rounded-2xl border border-white/10 bg-white/[0.08] backdrop-blur-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(34,197,94,0.35)] hover:bg-white/[0.12] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(34,197,94,0.12)]">
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[rgba(34,197,94,0.25)] rounded-tr-2xl" />

      <div className="flex items-start gap-2.5 mb-3">
        <div
          className="relative w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg"
          style={{ background: grad }}
        >
          {initials(p.display_name)}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22c55e] border-2 border-[#0a0a0a]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{p.display_name ?? "—"}</p>
          <p className="text-[11px] text-white/60 truncate leading-tight mt-0.5">{p.headline ?? p.skills[0] ?? ""}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[#f59e0b] text-[11px]">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {(flag || p.country_code) && (
        <p className="mt-1.5 text-[11px] text-white/50">{flag} {p.country_code}</p>
      )}
    </div>
  );
}

export async function TalentStrip({ locale = "fr" }: { locale?: Locale }) {
  const providers = await getBoostedProviders();
  if (providers.length === 0) return null;

  const label = locale === "fr"
    ? "Talents vérifiés · disponibles maintenant"
    : "Verified talents · available now";

  const doubled = [...providers, ...providers];

  return (
    <div className="relative border-t border-[rgba(34,197,94,0.07)] border-b border-[rgba(34,197,94,0.07)] bg-black/20 overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-28 z-10 bg-gradient-to-r from-[var(--background)] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-28 z-10 bg-gradient-to-l from-[var(--background)] to-transparent" />

      <div className="flex items-center justify-center gap-3 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[rgba(34,197,94,0.35)]">
        <span className="h-px w-24 bg-gradient-to-r from-transparent to-[rgba(34,197,94,0.15)]" />
        <span className="online-dot" />
        {label}
        <span className="online-dot" />
        <span className="h-px w-24 bg-gradient-to-l from-transparent to-[rgba(34,197,94,0.15)]" />
      </div>

      <div className="overflow-hidden pb-5">
        <div className="talent-track">
          {doubled.map((p, i) => (
            <TalentCard key={`${p.id}-${i}`} p={p} idx={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
