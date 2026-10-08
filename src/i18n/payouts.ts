// Textes de la page Versements du prestataire, FR et EN.
import type { Locale } from "./dictionaries";

const fr = {
  title: "Versements",
  subtitle: "Ce que vous avez gagné et comment vous serez payé",
  notice: "Les versements automatiques ne sont pas encore activés. Votre canal est enregistré ; les virements seront effectués dès l'ouverture des paiements.",
  earned: "Encaissé",
  earnedHint: "Missions validées, net",
  pending: "En cours",
  pendingHint: "Commandes non encore validées, net",
  channel: "Canal de versement",
  channels: { wave: "Wave", orange_money: "Orange Money", mtn_momo: "MTN MoMo", moov_money: "Moov Money", bank_transfer: "Virement bancaire" } as Record<string, string>,
  choose: "Choisir…",
  number: "Numéro mobile money",
  numberHint: "Format international, ex. +225 07 00 00 00 00",
  save: "Enregistrer",
  saving: "Enregistrement…",
  saved: "Canal de versement enregistré.",
  verified: "Numéro vérifié",
  notVerified: "Numéro non vérifié",
  history: "Commandes",
  empty: "Aucune commande pour l'instant",
  emptyBody: "Vos gains apparaîtront ici dès la première mission.",
  status: { pending_payment: "En attente de paiement", funded: "Paiement conservé", in_progress: "En cours", delivered: "Livré", completed: "Validée", disputed: "Litige", cancelled: "Annulée", refunded: "Remboursée" } as Record<string, string>,
  errors: {
    channel: "Choisissez un canal de versement.",
    number: "Numéro invalide : 8 à 15 chiffres, indicatif pays possible.",
    save: "Le canal n'a pas pu être enregistré.",
    notProvider: "Réservé aux comptes prestataires.",
  },
};

const en: typeof fr = {
  title: "Payouts",
  subtitle: "What you have earned and how you will be paid",
  notice: "Automatic payouts are not active yet. Your channel is saved; transfers will be made once payments open.",
  earned: "Earned",
  earnedHint: "Approved missions, net",
  pending: "In progress",
  pendingHint: "Orders not yet approved, net",
  channel: "Payout channel",
  channels: { wave: "Wave", orange_money: "Orange Money", mtn_momo: "MTN MoMo", moov_money: "Moov Money", bank_transfer: "Bank transfer" },
  choose: "Choose…",
  number: "Mobile money number",
  numberHint: "International format, e.g. +225 07 00 00 00 00",
  save: "Save",
  saving: "Saving…",
  saved: "Payout channel saved.",
  verified: "Number verified",
  notVerified: "Number not verified",
  history: "Orders",
  empty: "No orders yet",
  emptyBody: "Your earnings will appear here after your first mission.",
  status: { pending_payment: "Awaiting payment", funded: "Payment held", in_progress: "In progress", delivered: "Delivered", completed: "Approved", disputed: "Dispute", cancelled: "Cancelled", refunded: "Refunded" },
  errors: {
    channel: "Choose a payout channel.",
    number: "Invalid number: 8 to 15 digits, country code allowed.",
    save: "The channel could not be saved.",
    notProvider: "Reserved for provider accounts.",
  },
};

export const payoutTexts: Record<Locale, typeof fr> = { fr, en };
export function getPayoutTexts(locale: Locale): typeof fr {
  return payoutTexts[locale];
}
