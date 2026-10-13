import type { LucideIcon } from "lucide-react";
import {
  Palette, Code2, MessagesSquare, Clapperboard, PenLine, Megaphone,
  Calculator, Camera, Music, Shirt, CalendarDays, GraduationCap,
  Bot, Briefcase, Globe, Mic, Video, LayoutDashboard, Wrench,
  BookOpen, ChefHat, Heart, Building2,
} from "lucide-react";

export type CategoryMeta = {
  icon: LucideIcon;
  blurbFr: string;
  blurbEn: string;
};

export const CATEGORY_META: Record<string, CategoryMeta> = {
  // ── Existantes (enrichies) ─────────────────────────────────────────────────
  "design-graphique": {
    icon: Palette,
    blurbFr: "Logos, flyers, charte graphique, UI/UX, packaging, illustrations.",
    blurbEn: "Logos, flyers, brand identity, UI/UX, packaging, illustrations.",
  },
  "developpement-web": {
    icon: Code2,
    blurbFr: "Sites vitrines, boutiques en ligne, applications web et mobile.",
    blurbEn: "Websites, online shops, web and mobile applications.",
  },
  "community-management": {
    icon: MessagesSquare,
    blurbFr: "Gestion des réseaux sociaux, calendrier éditorial, modération.",
    blurbEn: "Social media management, editorial calendar, moderation.",
  },
  "montage-video": {
    icon: Clapperboard,
    blurbFr: "Montage, réels, publicités, sous-titrage, animation 2D/3D.",
    blurbEn: "Editing, reels, ads, subtitling, 2D/3D animation.",
  },
  "redaction-traduction": {
    icon: PenLine,
    blurbFr: "Articles, copywriting, ghostwriting, traduction, relecture.",
    blurbEn: "Articles, copywriting, ghostwriting, translation, proofreading.",
  },
  "marketing-digital": {
    icon: Megaphone,
    blurbFr: "Campagnes Meta & TikTok, Google Ads, SEO, email marketing.",
    blurbEn: "Meta & TikTok campaigns, Google Ads, SEO, email marketing.",
  },
  "comptabilite-admin": {
    icon: Calculator,
    blurbFr: "Saisie comptable, facturation, déclarations fiscales, secrétariat.",
    blurbEn: "Bookkeeping, invoicing, tax declarations, administrative support.",
  },
  photographie: {
    icon: Camera,
    blurbFr: "Photographie produits, événements, portraits, retouche photo.",
    blurbEn: "Product photography, events, portraits, photo retouching.",
  },

  // ── Nouvelles catégories ──────────────────────────────────────────────────
  "musique-audio": {
    icon: Music,
    blurbFr: "Production musicale, mixage, voix off, jingles, podcasts.",
    blurbEn: "Music production, mixing, voice-over, jingles, podcasts.",
  },
  "mode-textile-artisanat": {
    icon: Shirt,
    blurbFr: "Couture, broderie, teinture, stylisme, wax, bogolan, bijoux.",
    blurbEn: "Sewing, embroidery, dyeing, styling, wax, bogolan, jewelry.",
  },
  evenementiel: {
    icon: CalendarDays,
    blurbFr: "Mariages, conférences, décoration, DJ, MC, traiteur, sonorisation.",
    blurbEn: "Weddings, conferences, decoration, DJ, MC, catering, sound.",
  },
  "formation-coaching": {
    icon: GraduationCap,
    blurbFr: "Coaching de vie, mentorat, formations, soutien scolaire, e-learning.",
    blurbEn: "Life coaching, mentoring, training, tutoring, e-learning.",
  },
  "intelligence-artificielle": {
    icon: Bot,
    blurbFr: "Prompt engineering, chatbots, automatisation IA, formation IA.",
    blurbEn: "Prompt engineering, chatbots, AI automation, AI training.",
  },
  "business-conseil": {
    icon: Briefcase,
    blurbFr: "Business plan, étude de marché, conseil juridique, pitch deck.",
    blurbEn: "Business plan, market research, legal advice, pitch deck.",
  },
  "traduction-interpretation": {
    icon: Globe,
    blurbFr: "Traduction Français-Anglais-Arabe, langues locales, interprétariat.",
    blurbEn: "French-English-Arabic translation, local languages, interpreting.",
  },
  "voix-off-podcast": {
    icon: Mic,
    blurbFr: "Voix off, doublage, production podcast, jingle radio.",
    blurbEn: "Voice-over, dubbing, podcast production, radio jingle.",
  },
  "animation-motion": {
    icon: Video,
    blurbFr: "Animation 2D/3D, motion design, explainer vidéo, after effects.",
    blurbEn: "2D/3D animation, motion design, explainer videos, after effects.",
  },
  "developpement-mobile": {
    icon: LayoutDashboard,
    blurbFr: "Applications Android, iOS, Flutter, React Native.",
    blurbEn: "Android, iOS, Flutter, React Native applications.",
  },
  "maintenance-reparation": {
    icon: Wrench,
    blurbFr: "Réparation téléphones, informatique, électroménager, domotique.",
    blurbEn: "Phone repair, IT support, appliance repair, home automation.",
  },
  "cours-soutien-scolaire": {
    icon: BookOpen,
    blurbFr: "Soutien scolaire, cours particuliers, prépa aux examens (BEPC, BAC…).",
    blurbEn: "Private tutoring, school support, exam prep (BEPC, BAC…).",
  },
  "gastronomie-traiteur": {
    icon: ChefHat,
    blurbFr: "Traiteur, cuisine, livraison repas, formation cuisine africaine.",
    blurbEn: "Catering, cooking, meal delivery, African cuisine training.",
  },
  "bien-etre-sante": {
    icon: Heart,
    blurbFr: "Coaching sportif, nutrition, méditation, beauté, soins.",
    blurbEn: "Sports coaching, nutrition, meditation, beauty, wellness.",
  },
  immobilier: {
    icon: Building2,
    blurbFr: "Gestion locative, transaction immobilière, home staging.",
    blurbEn: "Property management, real estate transactions, home staging.",
  },
};

export function categoryMeta(slug: string): CategoryMeta | null {
  return CATEGORY_META[slug] ?? null;
}

/** Palette de couleurs par catégorie (cartes, placeholders d'images). */
export const CATEGORY_COLORS: Record<string, { from: string; to: string }> = {
  "design-graphique":          { from: "#9333ea", to: "#ec4899" },
  "developpement-web":         { from: "#2563eb", to: "#06b6d4" },
  "community-management":      { from: "#0d9488", to: "#10b981" },
  "montage-video":             { from: "#ea580c", to: "#ef4444" },
  "redaction-traduction":      { from: "#d97706", to: "#f59e0b" },
  "marketing-digital":         { from: "#db2777", to: "#a855f7" },
  "comptabilite-admin":        { from: "#4f46e5", to: "#3b82f6" },
  photographie:                { from: "#374151", to: "#6b7280" },
  "musique-audio":             { from: "#7c3aed", to: "#6d28d9" },
  "mode-textile-artisanat":    { from: "#b45309", to: "#d97706" },
  evenementiel:                { from: "#0891b2", to: "#0e7490" },
  "formation-coaching":        { from: "#16a34a", to: "#15803d" },
  "intelligence-artificielle": { from: "#1d4ed8", to: "#7c3aed" },
  "business-conseil":          { from: "#0f766e", to: "#0d9488" },
  "traduction-interpretation": { from: "#c2410c", to: "#ea580c" },
  "voix-off-podcast":          { from: "#9f1239", to: "#be123c" },
  "animation-motion":          { from: "#b91c1c", to: "#f97316" },
  "developpement-mobile":      { from: "#0369a1", to: "#0284c7" },
  "maintenance-reparation":    { from: "#525252", to: "#737373" },
  "cours-soutien-scolaire":    { from: "#15803d", to: "#16a34a" },
  "gastronomie-traiteur":      { from: "#92400e", to: "#b45309" },
  "bien-etre-sante":           { from: "#be185d", to: "#e11d48" },
  immobilier:                  { from: "#1e40af", to: "#1d4ed8" },
};

export const DEFAULT_COLORS = { from: "#6366f1", to: "#8b5cf6" };

export function categoryGradient(slug?: string | null): string {
  const c = (slug ? CATEGORY_COLORS[slug] : null) ?? DEFAULT_COLORS;
  return `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`;
}

/** Liste ordonnée des slugs pour les menus / filtres. */
export const CATEGORY_ORDER = Object.keys(CATEGORY_META);
