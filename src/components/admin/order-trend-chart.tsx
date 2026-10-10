import type { DailyPoint } from "@/lib/admin-stats";

/** Mini bar chart SVG pur — aucune dépendance externe. */
export function OrderTrendChart({
  data,
  label,
  emptyLabel,
}: {
  data: DailyPoint[];
  label: string;
  emptyLabel: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-[var(--subtle)]">
        {emptyLabel}
      </div>
    );
  }

  const W = 560;
  const H = 96;
  const PAD = { top: 8, bottom: 20, left: 0, right: 0 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = Math.max(...data.map((d) => d.orders_count), 1);
  const barW = Math.max(4, Math.floor(innerW / data.length) - 3);

  // Dates complètes sur 30 jours : combler les jours sans commande avec 0.
  const last = new Date(data[data.length - 1]?.day ?? new Date());
  const first = new Date(last);
  first.setDate(first.getDate() - 29);

  const filled: DailyPoint[] = [];
  const map = new Map(data.map((d) => [d.day.slice(0, 10), d]));
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    filled.push(map.get(key) ?? { day: key, orders_count: 0, amount_minor: 0n });
  }

  const total = filled.reduce((s, d) => s + d.orders_count, 0);
  const step = innerW / (filled.length - 1 || 1);

  // Ligne polyline pour la tendance.
  const points = filled
    .map((d, i) => {
      const x = PAD.left + i * step;
      const y = PAD.top + innerH - (d.orders_count / max) * innerH;
      return `${x},${y}`;
    })
    .join(" ");

  // Gradient defs id unique pour éviter les collisions si plusieurs charts sont rendus.
  const gradId = "trendGrad";

  const areaPoints = [
    `${PAD.left},${PAD.top + innerH}`,
    ...filled.map((d, i) => {
      const x = PAD.left + i * step;
      const y = PAD.top + innerH - (d.orders_count / max) * innerH;
      return `${x},${y}`;
    }),
    `${PAD.left + (filled.length - 1) * step},${PAD.top + innerH}`,
  ].join(" ");

  // Labels de date : premier et dernier.
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">{label}</p>
        <p className="font-display text-2xl font-bold">{total}</p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-400)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-brand-400)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Zone de remplissage */}
        <polygon points={areaPoints} fill={`url(#${gradId})`} />

        {/* Ligne de tendance */}
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-brand-500)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Barres verticales fines (guides) */}
        {filled.map((d, i) => {
          if (d.orders_count === 0) return null;
          const x = PAD.left + i * step;
          const y = PAD.top + innerH - (d.orders_count / max) * innerH;
          return (
            <circle
              key={d.day}
              cx={x}
              cy={y}
              r="3"
              fill="var(--color-brand-500)"
            />
          );
        })}

        {/* Étiquettes dates */}
        <text x={PAD.left} y={H} fontSize="10" fill="var(--subtle)" opacity="0.7">
          {fmtDate(filled[0]?.day ?? "")}
        </text>
        <text x={PAD.left + (filled.length - 1) * step} y={H} fontSize="10" fill="var(--subtle)" opacity="0.7" textAnchor="end">
          {fmtDate(filled[filled.length - 1]?.day ?? "")}
        </text>
      </svg>
    </div>
  );
}
