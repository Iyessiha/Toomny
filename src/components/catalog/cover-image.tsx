import { categoryMeta, categoryGradient } from "@/lib/categories";

type Props = {
  src: string | null | undefined;
  alt: string;
  categorySlug: string | null | undefined;
};

/**
 * Couverture de carte service : image par-dessus un gradient de fallback.
 * Le gradient est toujours rendu ; l'image CSS le recouvre si elle charge.
 * Aucun état client, aucune gestion d'erreur JS nécessaire.
 */
export function CoverImage({ src, alt, categorySlug }: Props) {
  const gradient = categoryGradient(categorySlug);
  const meta = categoryMeta(categorySlug ?? "");
  const Icon = meta?.icon ?? null;
  const initials = (alt ?? "P").slice(0, 2).toUpperCase();

  return (
    <div className="absolute inset-0">
      {/* Gradient de fallback — toujours visible si l'image ne charge pas */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: gradient }}
      >
        {Icon ? (
          <Icon className="h-10 w-10 text-white/80" />
        ) : (
          <span className="text-3xl font-bold text-white/60">{initials}</span>
        )}
      </div>

      {/* Image par-dessus le gradient — si elle échoue à charger, le gradient transparaît */}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
