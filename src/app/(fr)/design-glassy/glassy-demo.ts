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


/** Prestataires supplémentaires : ils peuplent les collages de chaque métier. */
export const DEMO_EXTRA: DemoProvider[] = [
  {
    id: "mariam",
    name: "Mariam Traoré",
    avatar: "/images/glassy/avatars/mariam-traore.jpg",
    headline: "Community management",
    country: "Abidjan, Côte d'Ivoire",
    flag: "🇨🇮",
    rating: 4.8,
    reviews: 19,
    completed: 23,
    skills: ["Calendrier", "Modération"],
    online: true,
  },
  {
    id: "ibrahima",
    name: "Ibrahima Sow",
    avatar: "/images/glassy/avatars/ibrahima-sow.jpg",
    headline: "Applications mobiles",
    country: "Dakar, Sénégal",
    flag: "🇸🇳",
    rating: 4.9,
    reviews: 12,
    completed: 14,
    skills: ["React Native", "API"],
  },
  {
    id: "nadia",
    name: "Nadia Bamba",
    avatar: "/images/glassy/avatars/nadia-bamba.jpg",
    headline: "Direction artistique",
    country: "Abidjan, Côte d'Ivoire",
    flag: "🇨🇮",
    rating: 5,
    reviews: 33,
    completed: 36,
    skills: ["Identité", "Édition"],
  },
  {
    id: "seydou",
    name: "Seydou Koné",
    avatar: "/images/glassy/avatars/seydou-kone.jpg",
    headline: "Photographie produit",
    country: "Bamako, Mali",
    flag: "🇲🇱",
    rating: 4.7,
    reviews: 15,
    completed: 18,
    skills: ["Studio", "Retouche"],
  },
  {
    id: "estelle",
    name: "Estelle Nkodo",
    avatar: "/images/glassy/avatars/estelle-nkodo.jpg",
    headline: "Rédaction & traduction",
    country: "Douala, Cameroun",
    flag: "🇨🇲",
    rating: 4.9,
    reviews: 28,
    completed: 31,
    skills: ["FR/EN", "Fiches produit"],
    online: true,
  },
  {
    id: "brahim",
    name: "Brahim Coulibaly",
    avatar: "/images/glassy/avatars/brahim-coulibaly.jpg",
    headline: "Comptabilité & admin",
    country: "Bamako, Mali",
    flag: "🇲🇱",
    rating: 4.6,
    reviews: 9,
    completed: 11,
    skills: ["Saisie", "Facturation"],
  },
  {
    id: "adjoua",
    name: "Adjoua Kouassi",
    avatar: "/images/glassy/avatars/adjoua-kouassi.jpg",
    headline: "Contenus sociaux",
    country: "Abidjan, Côte d'Ivoire",
    flag: "🇨🇮",
    rating: 4.8,
    reviews: 21,
    completed: 25,
    skills: ["Réels", "UGC"],
    online: true,
  },
];

export const ALL_PROVIDERS: DemoProvider[] = [...DEMO_PROVIDERS, ...DEMO_EXTRA];

/**
 * Collage de portraits par métier : c'est la composition de la référence
 * (ComeUp) — une mosaïque de visages à côté de chaque rubrique métier.
 */
export const CATEGORY_FACES: Record<string, string[]> = {
  "design-graphique": ["nadia", "awa", "seydou", "adjoua", "estelle"],
  "developpement-web": ["koffi", "ibrahima", "brahim", "nadia"],
  "montage-video": ["fatou", "adjoua", "seydou", "mariam"],
  "marketing-digital": ["yann", "mariam", "adjoua", "ibrahima"],
};

export function avatarOf(id: string): string {
  const found = ALL_PROVIDERS.find((p) => p.id === id);
  return found?.avatar ?? DEMO_PROVIDERS[0].avatar;
}

/** Image de couverture par catégorie, pour les cartes qui n'ont pas de photo. */
export const CATEGORY_COVER: Record<string, string> = {
  "design-graphique": "/images/glassy/design-graphique.jpg",
  "developpement-web": "/images/glassy/developpement-web.jpg",
  "montage-video": "/images/glassy/montage-video.jpg",
  "marketing-digital": "/images/glassy/marketing-digital.jpg",
  "community-management": "/images/glassy/community-management.jpg",
  photographie: "/images/glassy/photographie.jpg",
};
