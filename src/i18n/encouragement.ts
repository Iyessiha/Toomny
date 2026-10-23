import type { Locale } from "@/i18n/dictionaries";

const fr = {
  newOrder: {
    title: "Waouh, vous avez reçu une nouvelle commande ! 🎉",
    body: (n: number) =>
      n > 1
        ? `${n} commandes vous attendent. Démarrez-les vite pour impressionner vos clients.`
        : "Une commande vous attend. Démarrez-la vite pour impressionner votre client.",
    cta: "Voir les commandes",
  },
  toValidate: {
    title: "Votre livraison est prête ! ✨",
    body: () => "Vérifiez le travail livré, puis validez la commande en un clic.",
    cta: "Voir la livraison",
  },
  missionDone: {
    title: "Waouh, vous avez terminé une mission ! 🏆",
    body: (n: number) =>
      n > 1
        ? `${n} missions terminées. Continuez comme ça, chaque avis compte !`
        : "Votre première mission est terminée. Continuez comme ça, chaque avis compte !",
    cta: "Voir mes commandes",
  },
  publishFirst: {
    title: "Publiez votre première prestation 🚀",
    body: () => "Les clients cherchent des services comme le vôtre. Publiez-la, puis partagez-la.",
    cta: "Créer une prestation",
  },
  shareServices: {
    title: "Vos prestations sont prêtes : faites-les connaître 🚀",
    body: () =>
      "Chaque partage est une chance de recevoir votre première commande. Partagez votre profil sur vos réseaux.",
    shareHeading: "Partager mon profil",
    shareMessage: "Découvrez mes prestations sur Toomny.",
  },
  shareToomny: {
    title: "Faites découvrir Toomny 🎁",
    body: () =>
      "Plus il y a de monde sur Toomny, plus il y a de clients et de prestataires. Partagez-le avec vos proches.",
    shareHeading: "Partager Toomny",
    shareMessage: "Je viens de découvrir Toomny, une plateforme de services à découvrir.",
  },
  networks: { whatsapp: "WhatsApp", facebook: "Facebook", x: "X", linkedin: "LinkedIn", telegram: "Telegram" },
};

const en: typeof fr = {
  newOrder: {
    title: "Wow, you have received a new order! 🎉",
    body: (n: number) =>
      n > 1
        ? `${n} orders are waiting for you. Start them soon to impress your clients.`
        : "An order is waiting for you. Start it soon to impress your client.",
    cta: "View orders",
  },
  toValidate: {
    title: "Your delivery is ready! ✨",
    body: () => "Check the delivered work, then approve the order in one click.",
    cta: "View the delivery",
  },
  missionDone: {
    title: "Wow, you completed a mission! 🏆",
    body: (n: number) =>
      n > 1
        ? `${n} missions completed. Keep it up, every review counts!`
        : "Your first mission is complete. Keep it up, every review counts!",
    cta: "View my orders",
  },
  publishFirst: {
    title: "Publish your first service 🚀",
    body: () => "Clients are looking for services like yours. Publish it, then share it.",
    cta: "Create a service",
  },
  shareServices: {
    title: "Your services are ready: make them known 🚀",
    body: () =>
      "Every share is a chance to get your first order. Share your profile on your networks.",
    shareHeading: "Share my profile",
    shareMessage: "Discover my services on Toomny.",
  },
  shareToomny: {
    title: "Spread the word about Toomny 🎁",
    body: () =>
      "The more people on Toomny, the more clients and providers there are. Share it with your loved ones.",
    shareHeading: "Share Toomny",
    shareMessage: "I just discovered Toomny, a services platform worth a look.",
  },
  networks: { whatsapp: "WhatsApp", facebook: "Facebook", x: "X", linkedin: "LinkedIn", telegram: "Telegram" },
};

export type EncouragementTexts = typeof fr;

export function getEncouragementTexts(locale: Locale): EncouragementTexts {
  return locale === "en" ? en : fr;
}
