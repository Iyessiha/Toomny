/** Palette sobre et lisible : chaque prestataire garde toujours la même couleur. */
const PALETTE = [
  { bg: "#e6f4ec", fg: "#0b5d30" },
  { bg: "#e7eefb", fg: "#1e3a8a" },
  { bg: "#fbeee3", fg: "#9a3412" },
  { bg: "#f3e8fb", fg: "#6b21a8" },
  { bg: "#e5f4f3", fg: "#115e59" },
  { bg: "#fbe9ee", fg: "#9f1239" },
];

/** Couleur stable à partir du nom : même personne, même couleur d'un affichage à l'autre. */
export function colorFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/** Initiales colorées, utilisées quand le prestataire n'a pas de photo de profil. */
export function InitialsAvatar({ name, size, className = "" }: { name: string; size: number; className?: string }) {
  const color = colorFor(name);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
  return (
    <span
      aria-hidden
      className={`flex flex-none items-center justify-center rounded-full font-semibold ${className}`}
      style={{ width: size, height: size, background: color.bg, color: color.fg, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  );
}
