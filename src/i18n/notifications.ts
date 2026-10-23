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
  plan?: string;
  items?: string;
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
    order_payment_reminder: {
      title: "Votre commande attend le paiement",
      body: (p) =>
        p.ref
          ? `La commande ${p.ref} n'est pas encore lancée. Payez-la pour que le prestataire démarre.`
          : "Une de vos commandes n'est pas encore lancée. Payez-la pour que le prestataire démarre.",
    },
    service_changes_requested: {
      title: "Prestation à corriger",
      body: (p) =>
        p.service
          ? `Votre prestation « ${p.service} » demande quelques corrections. Les points à corriger sont affichés sur la prestation.`
          : "Une de vos prestations demande quelques corrections. Les points sont affichés sur la prestation.",
    },
    account_missing: {
      title: "Votre compte est à compléter",
      body: (p) =>
        p.items
          ? `Pour publier vos prestations, il reste à faire : ${p.items}.`
          : "Il reste des éléments à compléter sur votre compte.",
    },
    support_replied: {
      title: "Réponse de l'équipe Toomny",
      body: () => "L'équipe Toomny a répondu à votre demande de contact. Ouvrez-la pour lire la réponse.",
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
    subscription_activated: {
      title: "Plan activé",
      body: (p) =>
        `Votre abonnement au plan ${p.plan ?? ""} est actif pour 30 jours.`,
    },
    subscription_failed: {
      title: "Paiement d'abonnement refusé",
      body: (p) =>
        `Le paiement pour le plan ${p.plan ?? ""} n'a pas abouti. Vous pouvez réessayer.`,
    },
    service_approved: {
      title: "Prestation publiée",
      body: (p) =>
        p.service
          ? `Votre prestation « ${p.service} » est maintenant en ligne.`
          : "Votre prestation est maintenant en ligne.",
    },
    service_rejected: {
      title: "Prestation à revoir",
      body: (p) =>
        p.service
          ? `Votre prestation « ${p.service} » n'a pas été publiée. L'e-mail envoyé explique comment la compléter.`
          : "Une de vos prestations n'a pas été publiée. L'e-mail envoyé explique comment la compléter.",
    },
    service_removed: {
      title: "Prestation retirée",
      body: (p) =>
        p.service
          ? `Votre prestation « ${p.service} » a été retirée par notre équipe.`
          : "Une de vos prestations a été retirée par notre équipe.",
    },
    boost_activated: {
      title: "Boost activé",
      body: (p) =>
        `Votre Boost ${p.plan ?? ""} est actif pour 30 jours. Vos services sont maintenant mis en avant.`,
    },
    boost_failed: {
      title: "Paiement Boost refusé",
      body: (p) =>
        `Le paiement pour le Boost ${p.plan ?? ""} n'a pas abouti. Vous pouvez réessayer.`,
    },
    boost_reminder: {
      title: "Boostez votre prestation",
      body: (p) =>
        p.service
          ? `« ${p.service} » n'est pas encore boostée. Un boost la met en avant pendant 30 jours.`
          : "Votre prestation n'est pas encore boostée. Un boost la met en avant pendant 30 jours.",
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
    order_payment_reminder: {
      title: "Your order is awaiting payment",
      body: (p) =>
        p.ref
          ? `Order ${p.ref} has not started yet. Pay it so the provider can start.`
          : "One of your orders has not started yet. Pay it so the provider can start.",
    },
    service_changes_requested: {
      title: "Service to correct",
      body: (p) =>
        p.service
          ? `Your service "${p.service}" needs a few corrections. The points to correct are shown on the service.`
          : "One of your services needs a few corrections. The points are shown on the service.",
    },
    account_missing: {
      title: "Your account needs completing",
      body: (p) =>
        p.items
          ? `To publish your services, you still need to: ${p.items}.`
          : "Some items on your account still need completing.",
    },
    support_replied: {
      title: "Reply from the Toomny team",
      body: () => "The Toomny team replied to your contact request. Open it to read the reply.",
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
    subscription_activated: {
      title: "Plan activated",
      body: (p) =>
        `Your ${p.plan ?? ""} plan subscription is now active for 30 days.`,
    },
    subscription_failed: {
      title: "Subscription payment declined",
      body: (p) =>
        `The payment for the ${p.plan ?? ""} plan did not go through. You can try again.`,
    },
    service_approved: {
      title: "Service published",
      body: (p) =>
        p.service
          ? `Your service "${p.service}" is now live.`
          : "Your service is now live.",
    },
    service_rejected: {
      title: "Service to review",
      body: (p) =>
        p.service
          ? `Your service « ${p.service} » was not published. The email explains how to complete it.`
          : "One of your services was not published. The email explains how to complete it.",
    },
    service_removed: {
      title: "Service removed",
      body: (p) =>
        p.service
          ? `Your service "${p.service}" was removed by our team.`
          : "One of your services was removed by our team.",
    },
    boost_activated: {
      title: "Boost activated",
      body: (p) =>
        `Your ${p.plan ?? ""} Boost is active for 30 days. Your services are now featured.`,
    },
    boost_failed: {
      title: "Boost payment declined",
      body: (p) =>
        `The payment for the ${p.plan ?? ""} Boost did not go through. You can try again.`,
    },
    boost_reminder: {
      title: "Boost your service",
      body: (p) =>
        p.service
          ? `“${p.service}” is not boosted yet. A boost puts it in front of clients for 30 days.`
          : "Your service is not boosted yet. A boost puts it in front of clients for 30 days.",
    },
  } as Record<string, NotificationCopy>,
};

export const notificationTexts: Record<Locale, typeof fr> = { fr, en };

export function getNotificationTexts(locale: Locale): typeof fr {
  return notificationTexts[locale];
}
