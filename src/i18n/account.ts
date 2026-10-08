// Textes de la gestion de compte (export et suppression), FR et EN.
import type { Locale } from "./dictionaries";

const fr = {
  nav: "Mon compte",
  title: "Mon compte",
  subtitle: "Vos données et la gestion de votre compte",
  exportTitle: "Télécharger mes données",
  exportBody:
    "Un fichier JSON avec votre profil, vos commandes, vos messages, vos avis, vos litiges et vos écritures.",
  exportButton: "Télécharger (JSON)",
  deleteTitle: "Supprimer mon compte",
  deleteBody:
    "Votre profil et vos informations personnelles sont effacés, et vous ne pourrez plus vous connecter. Les commandes passées restent enregistrées de façon anonyme, pour la comptabilité et les litiges.",
  deleteLabel: "Saisissez votre adresse e-mail pour confirmer",
  deleteButton: "Supprimer définitivement mon compte",
  deleted: "Votre compte a été supprimé.",
  errors: {
    active:
      "Vous avez des commandes non terminées ou des versements en attente. Le compte ne peut être supprimé qu'une fois ceux-ci réglés.",
    email: "L'adresse saisie ne correspond pas à celle de votre compte.",
    failed: "La suppression a échoué. Réessayez, ou contactez le support.",
  },
};

const en: typeof fr = {
  nav: "My account",
  title: "My account",
  subtitle: "Your data and account settings",
  exportTitle: "Download my data",
  exportBody:
    "A JSON file with your profile, orders, messages, reviews, disputes and ledger entries.",
  exportButton: "Download (JSON)",
  deleteTitle: "Delete my account",
  deleteBody:
    "Your profile and personal information are erased, and you will no longer be able to sign in. Past orders stay on record in anonymous form, for accounting and disputes.",
  deleteLabel: "Enter your e-mail address to confirm",
  deleteButton: "Permanently delete my account",
  deleted: "Your account has been deleted.",
  errors: {
    active:
      "You have unfinished orders or pending payouts. The account can only be deleted once they are settled.",
    email: "The address you entered does not match your account.",
    failed: "Deletion failed. Try again, or contact support.",
  },
};

export const accountTexts: Record<Locale, typeof fr> = { fr, en };

export function getAccountTexts(locale: Locale): typeof fr {
  return accountTexts[locale];
}
