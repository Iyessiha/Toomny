import "./glassy.css";

/**
 * Coquille commune à toutes les pages de la maquette « Aurora Glass ».
 *
 * Elle porte le fond nocturne, les nappes d'aurore, le grain — et importe la
 * feuille de style du système de verre. Toute page qui l'utilise obtient le
 * même fond, sans dupliquer le balisage décoratif.
 */

const AURORA = [
  { top: "-18%", left: "-12%", size: "58vw", color: "rgba(16, 128, 67, 0.75)" },
  { top: "-26%", right: "-14%", size: "52vw", color: "rgba(210, 154, 56, 0.42)" },
  { bottom: "-30%", left: "22%", size: "66vw", color: "rgba(51, 164, 114, 0.55)" },
];

export function GlassyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-scope relative min-h-screen">
      <div className="aurora" aria-hidden>
        {AURORA.map((o, i) => (
          <span
            key={i}
            className="aurora-orb"
            style={{
              top: o.top,
              left: o.left,
              right: o.right,
              bottom: o.bottom,
              width: o.size,
              height: o.size,
              background: o.color,
            }}
          />
        ))}
        <span className="aurora-grid" />
      </div>
      {children}
    </div>
  );
}

/** Bandeau « proposition de design », posé en haut de chaque maquette. */
export function GlassyContextBar({
  label,
  links,
}: {
  label: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="border-b border-white/10 bg-black/25 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] sm:px-6">
        <span className="font-semibold uppercase tracking-[0.18em] text-[#8bf0b6]">{label}</span>
        <span className="flex items-center gap-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-white/65 underline-offset-4 hover:text-white hover:underline"
            >
              {l.label}
            </a>
          ))}
        </span>
      </div>
    </div>
  );
}
