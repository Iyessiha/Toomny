import type { LucideIcon } from "lucide-react";
import { Palette, Code2, MessagesSquare, Clapperboard, PenLine, Megaphone, Calculator, Camera } from "lucide-react";

/**
 * Présentation des catégories, indexée par slug. La liste elle-même vient de la
 * base (table `categories`) : un slug inconnu de cette table ne s'affiche pas,
 * et une catégorie sans entrée ici s'affiche avec une icône générique.
 */
export type CategoryMeta = {
  icon: LucideIcon;
  blurbFr: string;
  blurbEn: string;
};

export const CATEGORY_META: Record<string, CategoryMeta> = {
  "design-graphique": { icon: Palette, blurbFr: "Logos, flyers, charte graphique, packaging.", blurbEn: "Logos, flyers, brand guides, packaging." },
  "developpement-web": { icon: Code2, blurbFr: "Sites vitrines, boutiques en ligne, applications.", blurbEn: "Websites, online shops, applications." },
  "community-management": { icon: MessagesSquare, blurbFr: "Publications, modération, calendrier éditorial.", blurbEn: "Posts, moderation, editorial calendar." },
  "montage-video": { icon: Clapperboard, blurbFr: "Réels, publicités, sous-titrage.", blurbEn: "Reels, ads, subtitling." },
  "redaction-traduction": { icon: PenLine, blurbFr: "Articles, fiches produit, traduction français-anglais.", blurbEn: "Articles, product copy, French-English translation." },
  "marketing-digital": { icon: Megaphone, blurbFr: "Campagnes Meta et TikTok, référencement SEO.", blurbEn: "Meta and TikTok campaigns, SEO." },
  "comptabilite-admin": { icon: Calculator, blurbFr: "Saisie, facturation, assistance administrative.", blurbEn: "Data entry, invoicing, administrative support." },
  photographie: { icon: Camera, blurbFr: "Produits, événements, portraits.", blurbEn: "Products, events, portraits." },
};

export function categoryMeta(slug: string): CategoryMeta | null {
  return CATEGORY_META[slug] ?? null;
}
