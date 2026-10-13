/**
 * Skills prédéfinis par catégorie.
 * Utilisés pour l'autocomplete dans le profil prestataire et la création de service.
 * Inspiré de Fiverr, Upwork, ComeUp — adapté au marché ouest-africain.
 */

export type SkillCategory = {
  label: string;
  labelEn: string;
  skills: string[];
};

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    label: "Design & Création",
    labelEn: "Design & Creative",
    skills: [
      "Logo & Identité visuelle", "Flyer & Affiche", "Charte graphique",
      "Packaging", "Carte de visite", "Bannière réseaux sociaux",
      "Infographie", "Illustration", "Bande dessinée / Comics",
      "Design UI/UX", "Maquette (Figma/XD)", "Design d'icônes",
      "Motion design", "3D & Modélisation", "Design de T-shirt",
      "Design textile (wax, bogolan)", "Calligraphie & Typographie",
      "NFT & Art numérique", "Design de présentation",
    ],
  },
  {
    label: "Développement & Tech",
    labelEn: "Development & Tech",
    skills: [
      "Développement web (HTML/CSS)", "React / Next.js", "Vue.js",
      "Node.js / Express", "PHP / Laravel", "WordPress",
      "Shopify / E-commerce", "Flutter / React Native",
      "Développement Android", "Développement iOS",
      "Python", "Django / FastAPI", "Machine Learning / IA",
      "Automatisation (n8n, Zapier)", "API REST / GraphQL",
      "Base de données (SQL, MongoDB)", "DevOps / Docker",
      "Cybersécurité", "Blockchain / Smart Contracts",
      "Scraping de données", "Excel / Google Sheets avancé",
      "Power BI / Tableau", "CRM (HubSpot, Salesforce)",
    ],
  },
  {
    label: "Marketing & Ventes",
    labelEn: "Marketing & Sales",
    skills: [
      "Community Management", "Publicité Facebook & Instagram",
      "Publicité Google Ads", "TikTok Ads",
      "Email Marketing", "Stratégie de contenu",
      "SEO (référencement naturel)", "Copywriting & Texte persuasif",
      "Gestion de campagne publicitaire", "Marketing d'influence",
      "Affiliation", "Growth Hacking",
      "Analyse de données marketing", "Stratégie de marque (Branding)",
      "Prospection commerciale", "Télémarketing",
    ],
  },
  {
    label: "Rédaction & Contenu",
    labelEn: "Writing & Content",
    skills: [
      "Rédaction d'articles de blog", "Rédaction publicitaire (Copywriting)",
      "Rédaction de fiches produit", "Ghostwriting",
      "Script vidéo / Podcast", "Communiqué de presse",
      "Biographie professionnelle", "Rédaction juridique",
      "Traduction Français ↔ Anglais", "Traduction Français ↔ Arabe",
      "Traduction Français ↔ Wolof / Dioula / Haoussa",
      "Relecture & Correction", "Transcription audio/vidéo",
      "Rédaction académique", "Plan d'affaires (Business Plan)",
    ],
  },
  {
    label: "Vidéo & Audio",
    labelEn: "Video & Audio",
    skills: [
      "Montage vidéo", "Réels & TikToks", "Sous-titrage",
      "Vidéo promotionnelle", "Animation 2D",
      "Animation explainer (after effects)", "Introduction de chaîne YouTube",
      "Doublage & Voix off", "Podcast (montage & production)",
      "Prise de son & Mixage", "Production musicale",
      "Jingle & Musique publicitaire", "Sound design",
      "Transcription audio", "Retouche photo",
    ],
  },
  {
    label: "Business & Gestion",
    labelEn: "Business & Management",
    skills: [
      "Comptabilité & Saisie", "Facturation",
      "Déclaration fiscale", "Business Plan",
      "Étude de marché", "Présentation PowerPoint",
      "Gestion de projet (PMO)", "Formation professionnelle",
      "Recrutement & RH", "Assistanat administratif",
      "Service client", "Secrétariat",
      "Rédaction de contrats", "Conseil juridique",
      "Levée de fonds / Pitch deck", "Gestion des réseaux sociaux d'entreprise",
    ],
  },
  {
    label: "Formation & Coaching",
    labelEn: "Training & Coaching",
    skills: [
      "Coaching de vie", "Coaching entrepreneurial",
      "Formation informatique", "Formation en langues",
      "Soutien scolaire", "Cours en ligne (e-learning)",
      "Formation en leadership", "Mentorat",
      "Développement personnel", "Coaching sportif",
      "Nutrition & Bien-être", "Méditation & Mindfulness",
    ],
  },
  {
    label: "Mode, Textile & Artisanat",
    labelEn: "Fashion, Textile & Crafts",
    skills: [
      "Couture & Confection", "Broderie",
      "Stylisme & Conseil mode", "Teinture (Tie-dye, Batik)",
      "Tissage (Kente, Bogolan)", "Maroquinerie",
      "Bijouterie artisanale", "Création de wax personnalisé",
      "Vannerie & Paniers", "Sculpture & Poterie",
      "Peinture artistique", "Photographie de mode",
    ],
  },
  {
    label: "Événementiel",
    labelEn: "Events",
    skills: [
      "Organisation de mariage", "Organisation de conférence",
      "Décoration événementielle", "DJ & Sonorisation",
      "Animation de soirée", "Traiteur / Restauration",
      "Photography événementielle", "Vidéographie événementielle",
      "Master of Ceremony (MC)", "Impression & Impression publicitaire",
    ],
  },
  {
    label: "Intelligence Artificielle",
    labelEn: "Artificial Intelligence",
    skills: [
      "Prompt Engineering (ChatGPT, Claude…)", "Automatisation avec IA",
      "Fine-tuning de modèles", "Création de chatbots",
      "Analyse de données avec IA", "Génération d'images (Midjourney, DALL-E)",
      "Montage vidéo assisté IA", "Traduction automatique",
      "Formation à l'IA", "Agents IA",
    ],
  },
];

/** Toute la liste à plat pour l'autocomplete. */
export const ALL_SKILLS: string[] = SKILL_CATEGORIES.flatMap((c) => c.skills);

/** Cherche les skills correspondant à une requête (insensible à la casse). */
export function searchSkills(query: string, limit = 10): string[] {
  const q = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return ALL_SKILLS.filter((s) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q)
  ).slice(0, limit);
}
