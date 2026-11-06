/**
 * Contenu de démonstration de la maquette « Aurora Glass ».
 *
 * Ce fichier ne sert QUE la maquette (/design-glassy et /design-glassy/dashboards).
 * Aucune donnée réelle, aucun accès base : quand les tables sont vides (ce qui est
 * le cas dans un bac à sable sans Supabase), la vitrine a quand même de la matière.
 * Les noms sont fictifs, les montants en FCFA, les images générées pour la maquette.
 */

export type DemoService = {
  id: string;
  title: string;
  category: string;
  icon: string;
  cover: string | null;
  price: string;
  delivery: string;
  boosted?: boolean;
  provider: DemoProvider;
};

export type DemoProvider = {
  id: string;
  name: string;
  avatar: string;
  headline: string;
  country: string;
  flag: string;
  rating: number;
  reviews: number;
  completed: number;
  skills: string[];
  online?: boolean;
};

export const DEMO_PROVIDERS: DemoProvider[] = [
  {
    id: "awa",
    name: "Awa Konaté",
    avatar: "/images/glassy/avatars/awa-konate.jpg",
    headline: "Identité visuelle & packaging",
    country: "Abidjan, Côte d'Ivoire",
    flag: "🇨🇮",
    rating: 4.9,
    reviews: 47,
    completed: 52,
    skills: ["Logo", "Charte graphique", "Packaging"],
    online: true,
  },
  {
    id: "koffi",
    name: "Koffi N'Guessan",
    avatar: "/images/glassy/avatars/koffi-n-guessan.jpg",
    headline: "Sites vitrines & boutiques en ligne",
    country: "Bouaké, Côte d'Ivoire",
    flag: "🇨🇮",
    rating: 4.8,
    reviews: 31,
    completed: 38,
    skills: ["Next.js", "E-commerce", "SEO"],
    online: true,
  },
  {
    id: "fatou",
    name: "Fatou Diallo",
    avatar: "/images/glassy/avatars/fatou-diallo.jpg",
    headline: "Montage vidéo & motion design",
    country: "Dakar, Sénégal",
    flag: "🇸🇳",
    rating: 5,
    reviews: 24,
    completed: 26,
    skills: ["Réels", "Publicités", "Sous-titrage"],
  },
  {
    id: "yann",
    name: "Yann Adjovi",
    avatar: "/images/glassy/avatars/yann-adjovi.jpg",
    headline: "Publicités Meta & TikTok",
    country: "Cotonou, Bénin",
    flag: "🇧🇯",
    rating: 4.7,
    reviews: 18,
    completed: 21,
    skills: ["Meta Ads", "TikTok", "Analytics"],
    online: true,
  },
];

const byId = (id: string) => DEMO_PROVIDERS.find((p) => p.id === id)!;

export const DEMO_SERVICES: DemoService[] = [
  {
    id: "identite-visuelle",
    title: "Je crée une identité visuelle complète pour votre marque",
    category: "Design graphique",
    icon: "design-graphique",
    cover: "/images/glassy/design-graphique.jpg",
    price: "150 000 FCFA",
    delivery: "5 jours",
    boosted: true,
    provider: byId("awa"),
  },
  {
    id: "site-vitrine",
    title: "Je développe votre site vitrine responsive en 10 jours",
    category: "Développement web",
    icon: "developpement-web",
    cover: "/images/glassy/developpement-web.jpg",
    price: "320 000 FCFA",
    delivery: "10 jours",
    provider: byId("koffi"),
  },
  {
    id: "reels",
    title: "Je monte 4 réels par mois pour vos réseaux sociaux",
    category: "Montage vidéo",
    icon: "montage-video",
    cover: "/images/glassy/montage-video.jpg",
    price: "95 000 FCFA",
    delivery: "3 jours",
    boosted: true,
    provider: byId("fatou"),
  },
  {
    id: "meta-ads",
    title: "Je pilote vos campagnes Meta et TikTok pendant un mois",
    category: "Marketing digital",
    icon: "marketing-digital",
    cover: "/images/glassy/marketing-digital.jpg",
    price: "180 000 FCFA",
    delivery: "30 jours",
    provider: byId("yann"),
  },
  {
    id: "community",
    title: "Je gère vos réseaux sociaux et votre calendrier éditorial",
    category: "Community management",
    icon: "community-management",
    cover: "/images/glassy/community-management.jpg",
    price: "120 000 FCFA",
    delivery: "30 jours",
    provider: byId("awa"),
  },
  {
    id: "photo-produit",
    title: "Je photographie 10 produits pour votre boutique en ligne",
    category: "Photographie",
    icon: "photographie",
    cover: "/images/glassy/photographie.jpg",
    price: "85 000 FCFA",
    delivery: "4 jours",
    provider: byId("fatou"),
  },
];

/** Image de couverture par catégorie, pour les cartes qui n'ont pas de photo. */
export const CATEGORY_COVER: Record<string, string> = {
  "design-graphique": "/images/glassy/design-graphique.jpg",
  "developpement-web": "/images/glassy/developpement-web.jpg",
  "montage-video": "/images/glassy/montage-video.jpg",
  "marketing-digital": "/images/glassy/marketing-digital.jpg",
  "community-management": "/images/glassy/community-management.jpg",
  photographie: "/images/glassy/photographie.jpg",
};
