import Link from "next/link";

// Kit « pro » des espaces connectés : statistiques, pastilles de statut,
// sections, actions rapides, avatar, tableaux. Client-safe : aucun import
// serveur (même règle que shell-ui.tsx).

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

const PILL: Record<Tone, string> = {
  success: "bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]",
  warning: "bg-[var(--tone-warning-bg)] text-[var(--tone-warning-fg)]",
  danger: "bg-[var(--tone-danger-bg)] text-[var(--tone-danger-fg)]",
  info: "bg-[var(--tone-info-bg)] text-[var(--tone-info-fg)]",
  neutral: "bg-[var(--tone-neutral-bg)] text-[var(--tone-neutral-fg)]",
  brand: "bg-[var(--tone-brand-bg)] text-[var(--tone-brand-fg)]",
};

/** Pastille de statut : bilingue par le texte qu'on lui passe, ton par le sens. */
export function Pill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${PILL[tone]}`}
    >
      {children}
    </span>
  );
}

/** Ton d'une commande : succès, litige, clôture neutre, livraison, attente. */
export function orderTone(status: string): Tone {
  if (status === "completed") return "success";
  if (status === "disputed") return "danger";
  if (status === "cancelled" || status === "refunded") return "neutral";
  if (status === "delivered") return "info";
  return "warning";
}

/** Ton d'une prestation : publiée, en pause, retirée, brouillon. */
export function serviceTone(status: string): Tone {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  if (status === "removed") return "danger";
  return "neutral";
}

const TILE: Record<"brand" | "gold" | "plain", string> = {
  brand: "bg-[var(--color-brand-500)] text-white",
  gold: "bg-[var(--color-gold-500)] text-white",
  plain: "bg-[var(--surface)] text-[var(--color-brand-600)]",
};

/** Grande statistique avec tuile d'icône, valeur, indice et variation. */
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
  return (
    <div className="app-lift rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
      <div className="flex items-center justify-between gap-3">
        <span
          aria-hidden
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${TILE[tone]}`}
        >
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
            <svg
              aria-hidden
              className={`h-3 w-3 ${delta.up ? "" : "rotate-180"}`}
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M6 1l5 7H1l5-7z" />
            </svg>
            {delta.text}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--subtle)]">
        {label}
      </p>
      {hint && <p className="mt-1 text-xs text-[var(--subtle)]">{hint}</p>}
    </div>
  );
}

/** Carte de section avec en-tête (titre + action) et contenu matelassé ou flush. */
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
    <section
      className={`overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="truncate font-display text-base font-bold">{title}</h2>}
            {subtitle && <p className="mt-0.5 truncate text-xs text-[var(--subtle)]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

/** Tuile d'action rapide : icône, titre, description, chevron animé. */
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
    <Link
      href={href}
      className="app-lift group flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
    >
      <span
        aria-hidden
        className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--color-brand-600)] transition-colors group-hover:bg-[var(--color-brand-500)] group-hover:text-white"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-[var(--subtle)]">{desc}</span>
      </span>
      <svg
        aria-hidden
        className="h-4 w-4 flex-none text-[var(--subtle)] transition-transform group-hover:translate-x-0.5"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M6 12l4-4-4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

const AVATAR_TONES = [
  "bg-[var(--color-brand-500)]",
  "bg-[var(--color-brand-700)]",
  "bg-[var(--color-gold-500)]",
  "bg-[var(--color-gold-700)]",
] as const;

/** Avatar à initiales, teinte déterministe issue du nom. */
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
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];
  const initials = clean
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const box =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-sm";
  return (
    <span
      aria-hidden
      className={`flex flex-none items-center justify-center rounded-full font-display font-bold text-white ${tone} ${box}`}
    >
      {initials}
    </span>
  );
}

/** Fine barre de progression (profil complété, objectif…). */
export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "gold" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 overflow-hidden rounded-full bg-[var(--surface)]"
    >
      <div
        className={`h-full rounded-full ${
          tone === "gold" ? "bg-[var(--color-gold-500)]" : "bg-[var(--color-brand-500)]"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * Tableau habillé : on lui passe thead/tbody classiques, il applique
 * l'en-tête, les zébrures de survol et le défilement horizontal.
 */
export function TableCard({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          {title && <h2 className="truncate font-display text-base font-bold">{title}</h2>}
          {action}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm [&_tbody_td]:whitespace-nowrap [&_tbody_td]:px-4 [&_tbody_td]:py-3.5 [&_tbody_td]:align-middle [&_tbody_tr]:border-t [&_tbody_tr]:border-[var(--border)] [&_tbody_tr]:transition-colors [&_thead_th]:whitespace-nowrap [&_thead_th]:bg-[var(--surface)] [&_thead_th]:px-4 [&_thead_th]:py-3 [&_thead_th]:text-xs [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:tracking-wide [&_thead_th]:text-[var(--subtle)] hover:[&_tbody_tr]:bg-[var(--surface)]">
          {children}
        </table>
      </div>
    </section>
  );
}
