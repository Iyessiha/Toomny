import Image from "next/image";
import { categoryMeta, categoryGradient } from "@/lib/categories";

type Props = {
  src: string | null | undefined;
  alt: string;
  categorySlug: string | null | undefined;
};

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

      {/* Image par-dessus le gradient via next/image pour un chargement correct */}
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />
      )}
    </div>
  );
}
