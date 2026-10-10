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

/** Palette visuelle par catégorie — pour les cartes et placeholders d'images. */
export const CATEGORY_COLORS: Record<string, { from: string; to: string }> = {
  "design-graphique":     { from: "#9333ea", to: "#ec4899" },
  "developpement-web":    { from: "#2563eb", to: "#06b6d4" },
  "community-management": { from: "#0d9488", to: "#10b981" },
  "montage-video":        { from: "#ea580c", to: "#ef4444" },
  "redaction-traduction": { from: "#d97706", to: "#f59e0b" },
  "marketing-digital":    { from: "#db2777", to: "#a855f7" },
  "comptabilite-admin":   { from: "#4f46e5", to: "#3b82f6" },
  "photographie":         { from: "#374151", to: "#6b7280" },
};

export const DEFAULT_COLORS = { from: "#6366f1", to: "#8b5cf6" };

export function categoryGradient(slug?: string | null): string {
  const c = (slug ? CATEGORY_COLORS[slug] : null) ?? DEFAULT_COLORS;
  return `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`;
}
