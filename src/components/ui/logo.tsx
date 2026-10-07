type Props = {
  /** Taille de la marque en pixels. */
  size?: number;
  /** Afficher le nom à côté de la marque. */
  withWordmark?: boolean;
  className?: string;
};

/**
 * Marque Toomny : deux personnes dont les corps forment un cœur entrelacé.
 * Le tracé hérite de la couleur du parent via `currentColor`, pour qu'un
 * même fichier serve sur fond clair comme sur fond vert.
 */
export function Logo({ size = 32, withWordmark = true, className }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        fill="none"
        role="img"
        aria-label="Toomny"
        className="shrink-0"
      >
        <circle cx="43" cy="22" r="11.5" fill="currentColor" />
        <circle cx="77" cy="22" r="11.5" fill="currentColor" />
        <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="butt">
          <path d="M74 50C62 34 32 37 29 58C26 79 47 87 54 100" />
          <path d="M46 50C58 34 88 37 91 58C94 79 73 87 66 100" />
        </g>
      </svg>
      {withWordmark && (
        <span
          className="font-semibold tracking-tight"
          style={{ fontSize: size * 0.72, lineHeight: 1 }}
        >
          Toomny
        </span>
      )}
    </span>
  );
}
