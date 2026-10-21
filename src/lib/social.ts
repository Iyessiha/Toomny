/**
 * Réseaux sociaux officiels de Toomny. Partagés par le pied de page du site et par les e-mails.
 * Une variable d'environnement NEXT_PUBLIC_SOCIAL_* peut remplacer une URL.
 */
const SOCIAL_DEFAULTS: { label: string; envKey: string; url: string }[] = [
  { label: "Instagram", envKey: "NEXT_PUBLIC_SOCIAL_INSTAGRAM", url: "https://www.instagram.com/toomnymicroservice/" },
  { label: "Facebook", envKey: "NEXT_PUBLIC_SOCIAL_FACEBOOK", url: "https://www.facebook.com/profile.php?id=61587323335832" },
  { label: "TikTok", envKey: "NEXT_PUBLIC_SOCIAL_TIKTOK", url: "https://www.tiktok.com/@toomnymicroservice" },
  { label: "YouTube", envKey: "NEXT_PUBLIC_SOCIAL_YOUTUBE", url: "https://www.youtube.com/@ToomnyMicroservice" },
  { label: "LinkedIn", envKey: "NEXT_PUBLIC_SOCIAL_LINKEDIN", url: "https://ci.linkedin.com/in/toomny-africa-talents-989b583a8" },
];

export function socialLinks(): { label: string; url: string }[] {
  return SOCIAL_DEFAULTS.map(({ label, envKey, url }) => ({ label, url: process.env[envKey] || url }));
}
