// ---------------------------------------------------------------------------
// Textes du parcours d'authentification, FR et EN.
// Règle du dépôt : aucune chaîne en dur dans un composant. Toute clé ajoutée
// ici doit exister dans les deux langues.
// ---------------------------------------------------------------------------

import type { Locale } from "./dictionaries";

const fr = {
    title: "Rejoignez Toomny",
    lead: "Quelques secondes suffisent. Vous pourrez compléter votre profil ensuite.",
    aside: {
      heading: "Travailler ensemble, grandir ensemble",
      items: [
        { title: "Versement mobile money", body: "Sur votre Wave ou votre Orange Money. Sans société américaine, sans Payoneer." },
        { title: "Vous gardez 90 %", body: "10 % de commission côté prestataire, rien côté client. Publier et postuler sont gratuits." },
        { title: "Paiement conservé", body: "Le paiement du client sera conservé par un partenaire agréé jusqu'à la validation de la livraison." },
      ],
    },
    backHome: "Retour à l'accueil",
    copyright: "Toomny",
    tabs: { signup: "Créer un compte", login: "Se connecter" },
    roleLegend: "Je viens sur Toomny pour",
    roles: {
      client: { label: "🤝 Recruter", sub: "Trouver des prestataires" },
      provider: { label: "💼 Travailler", sub: "Proposer mes services" },
    },
    fields: {
      firstName: "Prénom",
      lastName: "Nom",
      phone: "Numéro de téléphone",
      phoneHintProvider: "Utilisé pour les versements mobile money (requis pour être payé).",
      phoneHintClient: "Utilisé pour les versements mobile money (optionnel).",
      country: "Pays",
      city: "Ville",
      email: "Adresse e-mail",
      password: "Mot de passe",
      passwordHint: "8 caractères minimum.",
    },
    placeholders: { firstName: "Kofi", lastName: "Asante", city: "Abidjan" },
    terms: "En créant un compte, vous acceptez nos",
    termsLink: "conditions d'utilisation",
    termsAnd: "et notre politique de confidentialité.",
    submit: { pending: "Un instant…", signup: "Créer mon compte", login: "Se connecter" },
    errors: {
      required: "Email et mot de passe requis.",
      nameRequired: "Le prénom et le nom sont obligatoires.",
      invalidCredentials: "Adresse e-mail ou mot de passe incorrect.",
      emailNotConfirmed: "Confirmez votre e-mail avant de vous connecter.",
      alreadyRegistered: "Cette adresse est déjà utilisée. Connectez-vous.",
      generic: "Une erreur est survenue.",
      login: "Erreur de connexion.",
    },
    sent: {
      title: "Vérifiez votre boîte mail",
      body: "Nous vous avons envoyé un lien de confirmation. Cliquez dessus pour activer votre compte Toomny.",
    },
};

const en: typeof fr = {
    title: "Join Toomny",
    lead: "It only takes a few seconds. You can complete your profile afterwards.",
    aside: {
      heading: "Work together, grow together",
      items: [
        { title: "Mobile money payouts", body: "Straight to your Wave or Orange Money. No US company, no Payoneer." },
        { title: "You keep 90%", body: "10% commission on the provider side, nothing on the buyer side. Publishing and applying are free." },
        { title: "Payment held", body: "The client's payment will be held by a licensed partner until delivery is approved." },
      ],
    },
    backHome: "Back to home",
    copyright: "Toomny",
    tabs: { signup: "Create an account", login: "Log in" },
    roleLegend: "I'm joining Toomny to",
    roles: {
      client: { label: "🤝 Hire", sub: "Find providers" },
      provider: { label: "💼 Work", sub: "Offer my services" },
    },
    fields: {
      firstName: "First name",
      lastName: "Last name",
      phone: "Phone number",
      phoneHintProvider: "Used for mobile money payouts (required to get paid).",
      phoneHintClient: "Used for mobile money payouts (optional).",
      country: "Country",
      city: "City",
      email: "Email address",
      password: "Password",
      passwordHint: "8 characters minimum.",
    },
    placeholders: { firstName: "Kofi", lastName: "Asante", city: "Accra" },
    terms: "By creating an account, you agree to our",
    termsLink: "terms of use",
    termsAnd: "and our privacy policy.",
    submit: { pending: "One moment…", signup: "Create my account", login: "Log in" },
    errors: {
      required: "Email and password are required.",
      nameRequired: "First and last name are required.",
      invalidCredentials: "Incorrect email or password.",
      emailNotConfirmed: "Please confirm your email before logging in.",
      alreadyRegistered: "This address is already used. Please log in.",
      generic: "Something went wrong.",
      login: "Login failed.",
    },
    sent: {
      title: "Check your inbox",
      body: "We sent you a confirmation link. Click it to activate your Toomny account.",
    },
};

export type AuthTexts = typeof fr;

export const authTexts: Record<Locale, AuthTexts> = { fr, en };

export const countryNames: Record<Locale, Record<string, string>> = {
  fr: {
    CI: "Côte d'Ivoire", SN: "Sénégal", BF: "Burkina Faso", ML: "Mali", BJ: "Bénin",
    TG: "Togo", NE: "Niger", GW: "Guinée-Bissau", CM: "Cameroun", GH: "Ghana", NG: "Nigeria",
  },
  en: {
    CI: "Côte d'Ivoire", SN: "Senegal", BF: "Burkina Faso", ML: "Mali", BJ: "Benin",
    TG: "Togo", NE: "Niger", GW: "Guinea-Bissau", CM: "Cameroon", GH: "Ghana", NG: "Nigeria",
  },
};

export function getAuthTexts(locale: Locale): AuthTexts {
  return authTexts[locale];
}
