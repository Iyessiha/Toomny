import Link from "next/link";

// Kit « verre avancé » de l'administration. Mêmes signatures que
// `@/components/dashboard/pro` (ProStat, Section, TableCard, MiniStat, Avatar),
// pour que les pages admin changent d'habillage en ne changeant que l'import.
// Aucun import serveur : utilisable depuis un composant client.

export {
  Pill,
  Notice,
  FilterTabs,
  ProgressBar,
  orderTone,
  serviceTone,
  payoutTone,
  disputeTone,
  kycTone,
  roleTone,
} from "@/components/dashboard/pro";
export type { Tone } from "@/components/dashboard/pro";

/** Grande statistique : verre teinté, tuile d'icône bombée, halo au survol. */
export function ProStat({
  icon,
  label,
  value,
  hint,
  tone = "plain",
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "brand" | "gold" | "plain";
  delta?: { text: string; up: boolean };
}) {
  const tint = tone === "brand" ? "glass-tone-brand" : tone === "gold" ? "glass-tone-gold" : "";
  const iconCls = tone === "brand" ? "glass-icon-brand" : tone === "gold" ? "glass-icon-gold" : "";
  return (
    <div className={`glass glass-lift ${tint} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <span aria-hidden className={`glass-icon h-11 w-11 ${iconCls}`}>
          {icon}
        </span>
        {delta && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
              delta.up
                ? "bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]"
                : "bg-[var(--tone-neutral-bg)] text-[var(--tone-neutral-fg)]"
            }`}
          >
            <svg aria-hidden className={`h-3 w-3 ${delta.up ? "" : "rotate-180"}`} viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 1l5 7H1l5-7z" />
            </svg>
            {delta.text}
          </span>
        )}
      </div>
      <p className="mt-5 font-display text-[28px] font-extrabold leading-none tracking-tight tabular-nums">{value}</p>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      {hint && <p className="mt-1 text-xs text-[var(--subtle)]">{hint}</p>}
    </div>
  );
}

/** Petite statistique compacte pour les bandeaux de totaux. */
export function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="glass glass-lift px-4 py-3" style={{ borderRadius: 18 }}>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--subtle)]">{label}</p>
      <p className="mt-1 font-display text-lg font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-[var(--subtle)]">{hint}</p>}
    </div>
  );
}

function PanelHead({ title, subtitle, action }: { title?: string; subtitle?: string; action?: React.ReactNode }) {
  if (!title && !action) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
      <div className="min-w-0">
        {title && (
          <h2 className="flex items-center gap-2 truncate font-display text-base font-bold">
            <span aria-hidden className="h-4 w-1 rounded-full bg-gradient-to-b from-[#8bf0b6] to-[#14a05a] shadow-[0_0_10px_rgba(79,220,140,0.7)]" />
            {title}
          </h2>
        )}
        {subtitle && <p className="mt-0.5 truncate text-xs text-[var(--subtle)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Panneau de verre avec en-tête (titre + action) et contenu matelassé ou flush. */
export function Section({
  title,
  subtitle,
  action,
  flush = false,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  flush?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass overflow-hidden ${className}`}>
      <PanelHead title={title} subtitle={subtitle} action={action} />
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

/** Tableau de verre : on passe thead/tbody classiques, l'habillage est dans `.adm-table`. */
export function TableCard({
  title,
  subtitle,
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="glass overflow-hidden">
      <PanelHead title={title} subtitle={subtitle} action={action} />
      <div className="overflow-x-auto">
        <table className="adm-table">{children}</table>
      </div>
    </section>
  );
}

/** Tuile d'action rapide. */
export function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="glass glass-lift group flex items-center gap-3 p-4" style={{ borderRadius: 18 }}>
      <span aria-hidden className="glass-icon h-10 w-10 flex-none">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-[var(--subtle)]">{desc}</span>
      </span>
      <svg aria-hidden className="h-4 w-4 flex-none text-[var(--subtle)] transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M6 12l4-4-4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

const AVATAR_GRADIENTS = [
  "from-[#8bf0b6] to-[#14a05a] text-[#04110b]",
  "from-[#f4dca6] to-[#d29a38] text-[#2a1d05]",
  "from-[#9cc6ff] to-[#4a7fd6] text-[#04101f]",
  "from-[#c9b6ff] to-[#7e5be0] text-[#0f0724]",
] as const;

/** Avatar à initiales : pastille de verre colorée, teinte déterministe issue du nom. */
export function Avatar({
  name,
  size = "md",
}: {
  name: string | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  const clean = (name ?? "").trim() || "?";
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  const tone = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
  const initials = clean
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const box = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-sm";
  return (
    <span
      aria-hidden
      className={`flex flex-none items-center justify-center rounded-full bg-gradient-to-br font-display font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_14px_-6px_rgba(0,0,0,0.8)] ring-1 ring-white/25 ${tone} ${box}`}
    >
      {initials}
    </span>
  );
}
