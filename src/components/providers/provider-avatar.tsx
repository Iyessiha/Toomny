import Image from "next/image";
import { InitialsAvatar } from "@/components/providers/initials-avatar";
import { CATEGORY_ILLUSTRATIONS } from "@/lib/provider-search";

/**
 * Avatar d'un prestataire : sa photo si elle existe, sinon l'illustration de sa catégorie,
 * sinon ses initiales. La photo reste ronde ; l'illustration garde le cadre carré arrondi.
 */
export function ProviderAvatar({
  name,
  photoUrl,
  categorySlug,
  size,
  className = "",
}: {
  name: string;
  photoUrl?: string | null;
  categorySlug?: string | null;
  size: number;
  className?: string;
}) {
  const box = { width: size, height: size };
  if (photoUrl) {
    return <Image src={photoUrl} alt={name} width={size} height={size} style={box} className={`flex-none rounded-full object-cover ${className}`} />;
  }
  if (categorySlug && CATEGORY_ILLUSTRATIONS.has(categorySlug)) {
    return (
      <Image src={`/images/categories/${categorySlug}.png`} alt="" width={size} height={size} style={box} className={`flex-none rounded-xl ${className}`} />
    );
  }
  return <InitialsAvatar name={name} size={size} className={className} />;
}
