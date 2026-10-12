// Textes des notifications in-app, FR et EN. Le corps est une fonction des
// paramètres stockés (expéditeur, référence…) : c'est la langue du lecteur
// qui gagne, pas celle de l'émetteur au moment de l'événement.
import type { Locale } from "./dictionaries";

export type NotificationParams = {
  from?: string;
  ref?: string;
  service?: string;
  outcome?: "won" | "lost";
  rating?: string;
  amount?: string;
};

export type NotificationCopy = { title: string; body: (p: NotificationParams) => string };

const fr = {
  bell: "Notifications",
  page: {
    metaTitle: "Notifications · Toomny",
    title: "Notifications",
    subtitle: "Demandes, messages, commandes, litiges : tout ce qui vous concerne.",
    markAll: "Tout marquer comme lu",
    unreadOne: "non lue",
    unreadMany: "non lues",
    emptyTitle: "Aucune notification",
    emptyBody:
      "Quand un client vous écrira ou qu'une commande avancera, vous serez prévenu ici.",
  },
  items: {
    inquiry_received: {
      title: "Nouvelle demande de contact",
      body: (p) =>
        `${p.from ?? "Un membre"} vous a écrit${p.service ? ` au sujet de « ${p.service} »` : ""}.`,
    },
    inquiry_replied: {
      title: "Nouvelle réponse",
      body: (p) => `${p.from ?? "Un membre"} a répondu à votre message.`,
    },
    order_funded: {
      title: "Commande payée",
      body: (p) =>
        `La commande ${p.ref ?? ""} est financée : le paiement est séquestré, vous pouvez démarrer.`,
    },
    order_payment_failed: {
      title: "Paiement refusé",
      body: (p) =>
        `Le paiement de la commande ${p.ref ?? ""} a été refusé. Réessayez ou choisissez un autre moyen.`,
    },
    order_message: {
      title: "Nouveau message",
      body: (p) =>
        `${p.from ?? "Un membre"} vous a écrit au sujet de la commande ${p.ref ?? ""}.`,
    },
    order_started: {
      title: "Commande démarrée",
      body: (p) => `Le prestataire a démarré la commande ${p.ref ?? ""}.`,
    },
    order_delivered: {
      title: "Livraison reçue",
      body: (p) =>
        `La commande ${p.ref ?? ""} a été livrée. Vérifiez le travail et acceptez sous 72 h.`,
    },
    order_completed: {
      title: "Commande terminée",
      body: (p) => `La commande ${p.ref ?? ""} est terminée. Les fonds sont débloqués.`,
    },
    order_cancelled: {
      title: "Commande annulée",
      body: (p) => `La commande ${p.ref ?? ""} a été annulée avant paiement.`,
    },
    dispute_opened: {
      title: "Litige ouvert",
      body: (p) =>
        `Un litige a été ouvert sur la commande ${p.ref ?? ""}. Notre équipe l'examine.`,
    },
    dispute_resolved: {
      title: "Litige tranché",
      body: (p) =>
        p.outcome === "won"
          ? `Le litige sur la commande ${p.ref ?? ""} est tranché en votre faveur.`
          : `Le litige sur la commande ${p.ref ?? ""} est tranché. Consultez le détail.`,
    },
    review_received: {
      title: "Nouvel avis",
      body: (p) =>
        p.rating
          ? `Vous avez reçu un avis ${p.rating}/5 sur la commande ${p.ref ?? ""}.`
          : `Vous avez reçu un nouvel avis sur la commande ${p.ref ?? ""}.`,
    },
    verification_approved: {
      title: "Identité vérifiée",
      body: () => "Votre identité est vérifiée. Votre badge apparaît sur votre profil.",
    },
    verification_rejected: {
      title: "Vérification refusée",
      body: () =>
        "Votre demande de vérification a été refusée. Consultez le motif et renvoyez vos pièces.",
    },
    payout_paid: {
      title: "Versement effectué",
      body: (p) => `Votre versement${p.amount ? ` de ${p.amount}` : ""} a été effectué.`,
    },
    payout_failed: {
      title: "Versement échoué",
      body: () => "Votre versement a échoué. Vérifiez votre numéro et faites une nouvelle demande.",
    },
  } as Record<string, NotificationCopy>,
};

const en: typeof fr = {
  bell: "Notifications",
  page: {
    metaTitle: "Notifications · Toomny",
    title: "Notifications",
    subtitle: "Inquiries, messages, orders, disputes: everything that concerns you.",
    markAll: "Mark all as read",
    unreadOne: "unread",
    unreadMany: "unread",
    emptyTitle: "No notifications",
    emptyBody:
      "When a buyer writes to you or an order moves forward, you will be notified here.",
  },
  items: {
    inquiry_received: {
      title: "New contact inquiry",
      body: (p) =>
        `${p.from ?? "A member"} wrote to you${p.service ? ` about “${p.service}”` : ""}.`,
    },
    inquiry_replied: {
      title: "New reply",
      body: (p) => `${p.from ?? "A member"} replied to your message.`,
    },
    order_funded: {
      title: "Order paid",
      body: (p) =>
        `Order ${p.ref ?? ""} is funded: the payment is held in escrow, you can start.`,
    },
    order_payment_failed: {
      title: "Payment declined",
      body: (p) =>
        `Payment for order ${p.ref ?? ""} was declined. Try again or pick another method.`,
    },
    order_message: {
      title: "New message",
      body: (p) =>
        `${p.from ?? "A member"} wrote to you about order ${p.ref ?? ""}.`,
    },
    order_started: {
      title: "Order started",
      body: (p) => `The provider started order ${p.ref ?? ""}.`,
    },
    order_delivered: {
      title: "Delivery received",
      body: (p) =>
        `Order ${p.ref ?? ""} was delivered. Review the work and accept within 72 hours.`,
    },
    order_completed: {
      title: "Order completed",
      body: (p) => `Order ${p.ref ?? ""} is complete. Funds are released.`,
    },
    order_cancelled: {
      title: "Order cancelled",
      body: (p) => `Order ${p.ref ?? ""} was cancelled before payment.`,
    },
    dispute_opened: {
      title: "Dispute opened",
      body: (p) =>
        `A dispute was opened on order ${p.ref ?? ""}. Our team is reviewing it.`,
    },
    dispute_resolved: {
      title: "Dispute decided",
      body: (p) =>
        p.outcome === "won"
          ? `The dispute on order ${p.ref ?? ""} was decided in your favour.`
          : `The dispute on order ${p.ref ?? ""} was decided. See details.`,
    },
    review_received: {
      title: "New review",
      body: (p) =>
        p.rating
          ? `You received a ${p.rating}/5 review on order ${p.ref ?? ""}.`
          : `You received a new review on order ${p.ref ?? ""}.`,
    },
    verification_approved: {
      title: "Identity verified",
      body: () => "Your identity is verified. Your badge now shows on your profile.",
    },
    verification_rejected: {
      title: "Verification declined",
      body: () =>
        "Your verification request was declined. Check the reason and resubmit your documents.",
    },
    payout_paid: {
      title: "Payout sent",
      body: (p) => `Your payout${p.amount ? ` of ${p.amount}` : ""} has been sent.`,
    },
    payout_failed: {
      title: "Payout failed",
      body: () => "Your payout failed. Check your number and submit a new request.",
    },
  } as Record<string, NotificationCopy>,
};

export const notificationTexts: Record<Locale, typeof fr> = { fr, en };

export function getNotificationTexts(locale: Locale): typeof fr {
  return notificationTexts[locale];
}
