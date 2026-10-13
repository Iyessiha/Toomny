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
        { title: "Vous gardez jusqu'à 96 %", body: "Dès 3 % de commission Toomny côté prestataire. 0 % de commission côté client. Publier et postuler sont gratuits." },
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
      phone: "Numéro WhatsApp",
      phoneHintProvider: "Numéro WhatsApp avec indicatif. Requis pour recevoir vos paiements mobile money.",
      phoneHintClient: "Numéro WhatsApp avec indicatif (optionnel).",
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
      captchaRequired: "Confirmez que vous n'êtes pas un robot.",
    },
    sent: {
      title: "Vérifiez votre boîte mail",
      body: "Nous vous avons envoyé un lien de confirmation. Cliquez dessus pour activer votre compte Toomny.",
    },
    forgotPassword: "Mot de passe oublié ?",
    forgot: {
      title: "Réinitialiser le mot de passe",
      lead: "Entrez votre adresse e-mail, nous vous enverrons un lien pour choisir un nouveau mot de passe.",
      submit: "Envoyer le lien",
      pending: "Envoi…",
      sent: {
        title: "Lien envoyé",
        body: "Si cette adresse existe dans notre base, vous recevrez un e-mail sous quelques minutes.",
      },
      errors: { generic: "Une erreur est survenue. Réessayez." },
      backToLogin: "Retour à la connexion",
    },
    reset: {
      title: "Choisir un nouveau mot de passe",
      lead: "Votre lien est valide. Entrez votre nouveau mot de passe.",
      newPassword: "Nouveau mot de passe",
      submit: "Enregistrer le mot de passe",
      pending: "Enregistrement…",
      success: {
        title: "Mot de passe mis à jour",
        body: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
        cta: "Se connecter",
      },
      errors: {
        invalid: "Le lien est expiré ou invalide. Recommencez.",
        generic: "Une erreur est survenue. Réessayez.",
        minLength: "8 caractères minimum.",
      },
    },
};

const en: typeof fr = {
    title: "Join Toomny",
    lead: "It only takes a few seconds. You can complete your profile afterwards.",
    aside: {
      heading: "Work together, grow together",
      items: [
        { title: "Mobile money payouts", body: "Straight to your Wave or Orange Money. No US company, no Payoneer." },
        { title: "You keep up to 96%", body: "From 3% Toomny commission on the provider side. 0% commission on the client side. Publishing and applying are free." },
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
      phone: "WhatsApp number",
      phoneHintProvider: "WhatsApp number with country code. Required to receive mobile money payouts.",
      phoneHintClient: "WhatsApp number with country code (optional).",
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
      captchaRequired: "Please confirm you are not a robot.",
    },
    sent: {
      title: "Check your inbox",
      body: "We sent you a confirmation link. Click it to activate your Toomny account.",
    },
    forgotPassword: "Forgot password?",
    forgot: {
      title: "Reset your password",
      lead: "Enter your email address and we'll send you a link to choose a new password.",
      submit: "Send link",
      pending: "Sending…",
      sent: {
        title: "Link sent",
        body: "If that address exists in our system, you will receive an email within a few minutes.",
      },
      errors: { generic: "Something went wrong. Try again." },
      backToLogin: "Back to login",
    },
    reset: {
      title: "Choose a new password",
      lead: "Your link is valid. Enter your new password.",
      newPassword: "New password",
      submit: "Save password",
      pending: "Saving…",
      success: {
        title: "Password updated",
        body: "You can now log in with your new password.",
        cta: "Log in",
      },
      errors: {
        invalid: "The link has expired or is invalid. Please try again.",
        generic: "Something went wrong. Try again.",
        minLength: "8 characters minimum.",
      },
    },
};

export type AuthTexts = typeof fr;

export const authTexts: Record<Locale, AuthTexts> = { fr, en };

export const countryNames: Record<Locale, Record<string, string>> = {
  fr: {
    CI: "Côte d'Ivoire", SN: "Sénégal", ML: "Mali", BF: "Burkina Faso",
    GN: "Guinée", TG: "Togo", BJ: "Bénin", NE: "Niger", GW: "Guinée-Bissau",
    CM: "Cameroun", NG: "Nigeria", GH: "Ghana", SL: "Sierra Leone", LR: "Liberia",
    GM: "Gambie", MR: "Mauritanie", MA: "Maroc", DZ: "Algérie", TN: "Tunisie",
    FR: "France", BE: "Belgique", CH: "Suisse", LU: "Luxembourg",
    CA: "Canada", US: "États-Unis",
  },
  en: {
    CI: "Côte d'Ivoire", SN: "Senegal", ML: "Mali", BF: "Burkina Faso",
    GN: "Guinea", TG: "Togo", BJ: "Benin", NE: "Niger", GW: "Guinea-Bissau",
    CM: "Cameroon", NG: "Nigeria", GH: "Ghana", SL: "Sierra Leone", LR: "Liberia",
    GM: "Gambia", MR: "Mauritania", MA: "Morocco", DZ: "Algeria", TN: "Tunisia",
    FR: "France", BE: "Belgium", CH: "Switzerland", LU: "Luxembourg",
    CA: "Canada", US: "United States",
  },
};

export function getAuthTexts(locale: Locale): AuthTexts {
  return authTexts[locale];
}
