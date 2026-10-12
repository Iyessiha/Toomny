import Link from "next/link";
import type { Locale } from "@/i18n/dictionaries";

const FR_SECTIONS = [
  {
    title: "1. Objet et champ d'application",
    body: `Les présentes conditions générales d'utilisation (« CGU ») régissent l'accès et l'utilisation de la plateforme Toomny (ci-après « la Plateforme »), éditée par Toomny SAS (ci-après « Toomny »), accessible à l'adresse toomny.com. En vous inscrivant ou en utilisant la Plateforme, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la Plateforme.

La Plateforme met en relation des clients (particuliers ou entreprises souhaitant acheter des services) et des prestataires (personnes physiques ou morales proposant des services). Toomny agit en tant qu'intermédiaire technique et financier : elle n'est pas partie au contrat de prestation conclu entre le client et le prestataire.`,
  },
  {
    title: "2. Définitions",
    body: `• **Client** : toute personne physique ou morale inscrite sur la Plateforme qui commande une prestation de service.
• **Prestataire** : toute personne physique ou morale inscrite sur la Plateforme qui propose et vend des prestations de service.
• **Service** : toute prestation proposée par un Prestataire et publiée sur la Plateforme.
• **Commande** : contrat conclu entre un Client et un Prestataire via la Plateforme.
• **Séquestre** : mécanisme par lequel Toomny conserve le paiement du Client jusqu'à la validation de la livraison.
• **Commission** : rémunération prélevée par Toomny sur le montant de chaque commande.
• **KYC** (Know Your Customer) : procédure de vérification d'identité requise des Prestataires avant le premier versement.`,
  },
  {
    title: "3. Inscription et compte utilisateur",
    body: `3.1. L'inscription est gratuite pour les Clients et les Prestataires. Chaque utilisateur doit créer un compte en fournissant des informations exactes, complètes et à jour.

3.2. Chaque utilisateur est responsable de la confidentialité de ses identifiants. Toute utilisation du compte est présumée effectuée par le titulaire. En cas de perte ou d'utilisation frauduleuse, l'utilisateur doit contacter Toomny immédiatement.

3.3. Un même utilisateur ne peut disposer que d'un seul compte actif. Toomny se réserve le droit de suspendre ou supprimer tout compte créé en violation de cette règle.

3.4. Les Prestataires doivent compléter la vérification d'identité (KYC) avant de recevoir tout versement. Cette vérification est requise par la réglementation financière applicable en Afrique de l'Ouest (BCEAO, OHADA).`,
  },
  {
    title: "4. Services proposés par Toomny",
    body: `Toomny propose :
• Une vitrine permettant aux Prestataires de publier et promouvoir leurs services ;
• Un système de mise en relation entre Clients et Prestataires ;
• Un mécanisme de paiement par séquestre (escrow) sécurisant les transactions ;
• Un outil de messagerie interne pour la communication entre parties ;
• Un système de notation et d'avis ;
• Un service d'arbitrage en cas de litige.

Toomny ne garantit pas la qualité, la conformité ni le résultat des services proposés par les Prestataires. Chaque Prestataire est responsable de ses prestations.`,
  },
  {
    title: "5. Commission et plans tarifaires",
    body: `5.1. Toomny prélève une commission sur chaque commande finalisée. Le taux applicable dépend du plan souscrit par le Prestataire :
• Plan Essentiel (gratuit) : 12 % du montant de la commande ;
• Plan Pro (4 900 FCFA/mois) : 10 % du montant de la commande ;
• Plan Expert (11 000 FCFA/mois) : 8 % du montant de la commande.

5.2. La commission est déduite automatiquement lors du versement au Prestataire. Aucun frais n'est prélevé sur le Client.

5.3. Les abonnements sont facturés mensuellement, sans engagement. Le Prestataire peut résilier son abonnement à tout moment depuis son tableau de bord.

5.4. Toomny se réserve le droit de modifier ses tarifs avec un préavis de 30 jours. Les commandes en cours lors de la modification restent soumises aux conditions tarifaires initiales.`,
  },
  {
    title: "6. Paiements et séquestre",
    body: `6.1. **Moyens de paiement acceptés** : Wave, Orange Money, MTN MoMo, Moov Money, carte bancaire (Visa, Mastercard). D'autres moyens pourront être ajoutés.

6.2. **Fonctionnement du séquestre** : lorsqu'un Client valide une commande, le paiement est conservé par Toomny sur un compte séquestre. Le montant n'est versé au Prestataire qu'après validation de la livraison par le Client ou à l'issue d'un délai de 72 heures suivant la livraison déclarée, si le Client n'a émis aucune contestation.

6.3. **Versements** : les versements aux Prestataires sont effectués via mobile money. Le Prestataire doit avoir configuré son canal de versement et complété sa vérification KYC. Les demandes de versement sont traitées dans un délai de 1 à 3 jours ouvrés.

6.4. **Annulation avant démarrage** : si le Prestataire n'a pas encore commencé la prestation, le Client peut demander une annulation. Le remboursement intégral est effectué dans un délai de 3 à 7 jours ouvrés.

6.5. **Taxes et obligations fiscales** : chaque utilisateur est responsable de ses propres obligations fiscales dans son pays de résidence. Toomny n'agit pas en tant que collecteur de TVA pour le compte des Prestataires.`,
  },
  {
    title: "7. Obligations des Prestataires",
    body: `Le Prestataire s'engage à :
• Fournir des informations exactes sur ses services (description, délais, prix) ;
• Livrer les prestations commandées dans les délais annoncés et selon les spécifications convenues ;
• Maintenir une note de satisfaction minimale permettant de rester actif sur la Plateforme ;
• Ne pas contacter les Clients en dehors de la Plateforme à des fins commerciales ;
• Respecter la confidentialité des informations partagées dans le cadre des commandes ;
• Compléter sa vérification KYC avant de demander un versement ;
• Ne pas proposer de services illicites, contraires à l'ordre public ou aux bonnes mœurs.

En cas de manquement, Toomny peut suspendre ou supprimer le compte du Prestataire, sans préjudice de tout dommage et intérêt dû au Client.`,
  },
  {
    title: "8. Obligations des Clients",
    body: `Le Client s'engage à :
• Fournir des informations de commande claires et complètes au Prestataire ;
• Évaluer les livraisons de bonne foi, sans retarder abusivement la validation ;
• Payer le montant convenu lors de la commande ;
• Ne pas détourner la relation commerciale hors de la Plateforme afin d'éviter les commissions ;
• Respecter la propriété intellectuelle des travaux réalisés par le Prestataire.

Toute tentative de contournement de la Plateforme peut entraîner la suspension définitive du compte.`,
  },
  {
    title: "9. Propriété intellectuelle",
    body: `9.1. Les livrables fournis par le Prestataire au Client dans le cadre d'une commande sont la propriété du Client dès lors que la commande est complètement payée et que le Prestataire n'a pas stipulé de conditions spécifiques sur sa fiche de service.

9.2. La marque Toomny, le logo, le design et l'ensemble des éléments de la Plateforme sont la propriété exclusive de Toomny. Toute reproduction ou utilisation sans autorisation est interdite.

9.3. En publiant du contenu sur la Plateforme (description, images, avis), l'utilisateur accorde à Toomny une licence d'utilisation mondiale, non exclusive et gratuite pour afficher et promouvoir ce contenu dans le cadre de ses activités.`,
  },
  {
    title: "10. Litiges entre Clients et Prestataires",
    body: `10.1. En cas de différend, les parties sont encouragées à trouver une solution amiable via le système de messagerie interne.

10.2. Si aucun accord n'est trouvé, l'une ou l'autre partie peut ouvrir un litige formel depuis la page de commande concernée. Toomny agit alors comme arbitre neutre.

10.3. Après réception des éléments de preuve soumis par les deux parties, Toomny rend sa décision dans un délai de 5 à 10 jours ouvrés : remboursement total au Client, versement total au Prestataire, ou solution intermédiaire.

10.4. La décision de Toomny est définitive et s'impose aux deux parties. En acceptant les présentes CGU, les parties renoncent à tout recours judiciaire préalable à la procédure d'arbitrage Toomny, sauf fraude avérée.`,
  },
  {
    title: "11. Données personnelles",
    body: `11.1. Toomny collecte et traite les données personnelles des utilisateurs conformément à sa Politique de confidentialité, disponible à l'adresse toomny.com/confidentialite.

11.2. Les données sont utilisées pour le fonctionnement de la Plateforme, la vérification d'identité, la prévention des fraudes, la communication entre parties, et l'amélioration des services.

11.3. Conformément à la loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel (Côte d'Ivoire) et au RGPD, chaque utilisateur dispose d'un droit d'accès, de rectification, d'effacement et de portabilité de ses données. Ces droits s'exercent via le tableau de bord ou en contactant privacy@toomny.com.`,
  },
  {
    title: "12. Limitation de responsabilité",
    body: `12.1. Toomny agit en tant qu'intermédiaire technique. Elle n'est pas responsable de la qualité, de l'exactitude ou de la légalité des services proposés par les Prestataires.

12.2. Toomny ne peut être tenue responsable des dommages indirects, pertes de profit ou d'opportunités résultant de l'utilisation de la Plateforme.

12.3. La responsabilité totale de Toomny, pour quelque motif que ce soit, est limitée au montant des commissions perçues au cours des 3 derniers mois précédant le litige.

12.4. Toomny ne peut être tenue responsable d'une indisponibilité temporaire de la Plateforme pour des raisons de maintenance, de force majeure ou de défaillance technique de tiers.`,
  },
  {
    title: "13. Suspension et résiliation",
    body: `13.1. L'utilisateur peut clôturer son compte à tout moment depuis la page « Mon compte ». Toute commande en cours doit être résolue avant la clôture.

13.2. Toomny se réserve le droit de suspendre ou résilier un compte en cas de :
• Violation des présentes CGU ;
• Fraude ou tentative de fraude ;
• Comportement abusif envers d'autres utilisateurs ou envers Toomny ;
• Fausse déclaration lors de l'inscription ou du KYC ;
• Inactivité prolongée (compte sans activité depuis plus de 24 mois).

13.3. En cas de résiliation pour faute, les montants en séquestre sont traités conformément à la procédure de litige, et Toomny peut retenir sa commission à titre de dommages et intérêts.`,
  },
  {
    title: "14. Modification des CGU",
    body: `Toomny peut modifier les présentes CGU à tout moment. Les utilisateurs sont informés par e-mail et/ou notification dans l'application avec un préavis de 30 jours. L'utilisation continue de la Plateforme après ce délai vaut acceptation des nouvelles conditions. En cas de désaccord, l'utilisateur peut clôturer son compte.`,
  },
  {
    title: "15. Droit applicable et juridiction",
    body: `Les présentes CGU sont soumises au droit ivoirien. Tout litige relatif à leur interprétation ou exécution sera soumis aux tribunaux compétents d'Abidjan (Côte d'Ivoire), sous réserve des règles d'ordre public applicables dans les pays de résidence des utilisateurs.

Pour les Prestataires et Clients établis dans d'autres États membres de l'OHADA, les règles de l'OHADA relatives aux contrats commerciaux s'appliquent à titre supplétif.

Pour toute question relative aux présentes CGU : support@toomny.com`,
  },
];

const EN_SECTIONS = [
  {
    title: "1. Purpose and Scope",
    body: `These Terms of Use ("Terms") govern access to and use of the Toomny platform ("Platform"), published by Toomny SAS ("Toomny"), accessible at toomny.com. By registering or using the Platform, you unreservedly accept these Terms. If you do not accept, please do not use the Platform.

The Platform connects clients (individuals or companies wishing to purchase services) and providers (individuals or companies offering services). Toomny acts as a technical and financial intermediary: it is not a party to the service contract concluded between the client and the provider.`,
  },
  {
    title: "2. Definitions",
    body: `• **Client**: any individual or legal entity registered on the Platform who orders a service.
• **Provider**: any individual or legal entity registered on the Platform who offers and sells services.
• **Service**: any service offered by a Provider and published on the Platform.
• **Order**: contract concluded between a Client and a Provider via the Platform.
• **Escrow**: mechanism by which Toomny holds the Client's payment until delivery is validated.
• **Commission**: fee charged by Toomny on each completed order.
• **KYC** (Know Your Customer): identity verification procedure required of Providers before the first payout.`,
  },
  {
    title: "3. Registration and User Account",
    body: `3.1. Registration is free for Clients and Providers. Each user must create an account providing accurate, complete and up-to-date information.

3.2. Each user is responsible for the confidentiality of their credentials. Any use of the account is presumed to have been made by the account holder. In case of loss or fraudulent use, the user must contact Toomny immediately.

3.3. Each user may only have one active account. Toomny reserves the right to suspend or delete any account created in violation of this rule.

3.4. Providers must complete identity verification (KYC) before receiving any payout. This verification is required by applicable financial regulations in West Africa (BCEAO, OHADA).`,
  },
  {
    title: "4. Services Offered by Toomny",
    body: `Toomny offers:
• A marketplace for Providers to publish and promote their services;
• A matchmaking system between Clients and Providers;
• A secure escrow payment mechanism;
• An internal messaging tool for communication between parties;
• A rating and review system;
• A dispute arbitration service.

Toomny does not guarantee the quality, compliance or outcome of services offered by Providers. Each Provider is responsible for their own services.`,
  },
  {
    title: "5. Commission and Pricing Plans",
    body: `5.1. Toomny charges a commission on each completed order. The applicable rate depends on the Provider's plan:
• Essential Plan (free): 12% of the order amount;
• Pro Plan (4,900 FCFA/month): 10% of the order amount;
• Expert Plan (11,000 FCFA/month): 8% of the order amount.

5.2. The commission is automatically deducted from the Provider's payout. No fees are charged to the Client.

5.3. Subscriptions are billed monthly with no commitment. Providers may cancel at any time from their dashboard.

5.4. Toomny reserves the right to modify its pricing with 30 days' notice. Orders in progress at the time of the modification remain subject to the original pricing conditions.`,
  },
  {
    title: "6. Payments and Escrow",
    body: `6.1. **Accepted payment methods**: Wave, Orange Money, MTN MoMo, Moov Money, bank card (Visa, Mastercard). Additional methods may be added.

6.2. **How escrow works**: when a Client places an order, the payment is held by Toomny in an escrow account. The amount is only released to the Provider once the Client validates delivery, or after 72 hours following declared delivery if the Client has raised no objection.

6.3. **Payouts**: payouts to Providers are processed via mobile money. The Provider must have configured their payout channel and completed KYC verification. Payout requests are processed within 1 to 3 business days.

6.4. **Cancellation before start**: if the Provider has not yet started the service, the Client may request cancellation. A full refund is processed within 3 to 7 business days.

6.5. **Taxes and fiscal obligations**: each user is responsible for their own tax obligations in their country of residence. Toomny does not collect VAT on behalf of Providers.`,
  },
  {
    title: "7. Provider Obligations",
    body: `The Provider agrees to:
• Provide accurate information about their services (description, deadlines, prices);
• Deliver ordered services within the stated timeframes and according to agreed specifications;
• Maintain a minimum satisfaction rating to remain active on the Platform;
• Not contact Clients outside the Platform for commercial purposes;
• Respect the confidentiality of information shared during orders;
• Complete KYC verification before requesting a payout;
• Not offer illegal services or services contrary to public order or morality.

In case of breach, Toomny may suspend or delete the Provider's account, without prejudice to any damages owed to the Client.`,
  },
  {
    title: "8. Client Obligations",
    body: `The Client agrees to:
• Provide clear and complete order information to the Provider;
• Evaluate deliveries in good faith, without unreasonably delaying validation;
• Pay the amount agreed at the time of the order;
• Not divert the commercial relationship outside the Platform to avoid commissions;
• Respect the intellectual property of work produced by the Provider.

Any attempt to circumvent the Platform may result in permanent account suspension.`,
  },
  {
    title: "9. Intellectual Property",
    body: `9.1. Deliverables provided by the Provider to the Client are the property of the Client once the order is fully paid, unless the Provider has stipulated specific conditions on their service listing.

9.2. The Toomny brand, logo, design and all Platform elements are the exclusive property of Toomny. Any reproduction or use without authorization is prohibited.

9.3. By publishing content on the Platform (descriptions, images, reviews), the user grants Toomny a worldwide, non-exclusive, royalty-free license to display and promote that content in connection with its activities.`,
  },
  {
    title: "10. Disputes Between Clients and Providers",
    body: `10.1. In case of disagreement, parties are encouraged to find an amicable solution via the internal messaging system.

10.2. If no agreement is reached, either party may open a formal dispute from the relevant order page. Toomny then acts as a neutral arbitrator.

10.3. After receiving the evidence submitted by both parties, Toomny renders its decision within 5 to 10 business days: full refund to the Client, full release to the Provider, or an intermediate solution.

10.4. Toomny's decision is final and binding on both parties. By accepting these Terms, parties waive any judicial recourse prior to Toomny's arbitration procedure, except in cases of proven fraud.`,
  },
  {
    title: "11. Personal Data",
    body: `11.1. Toomny collects and processes users' personal data in accordance with its Privacy Policy, available at toomny.com/confidentialite.

11.2. Data is used for Platform operation, identity verification, fraud prevention, communication between parties, and service improvement.

11.3. In accordance with applicable data protection laws (including Ivorian Law No. 2013-450 and the GDPR where applicable), each user has the right of access, rectification, erasure, and portability of their data. These rights can be exercised via the dashboard or by contacting privacy@toomny.com.`,
  },
  {
    title: "12. Limitation of Liability",
    body: `12.1. Toomny acts as a technical intermediary. It is not responsible for the quality, accuracy, or legality of services offered by Providers.

12.2. Toomny shall not be liable for indirect damages, loss of profit, or loss of opportunity resulting from use of the Platform.

12.3. Toomny's total liability, for any reason whatsoever, is limited to the commissions received during the 3 months preceding the dispute.

12.4. Toomny shall not be liable for temporary Platform unavailability due to maintenance, force majeure, or third-party technical failure.`,
  },
  {
    title: "13. Suspension and Termination",
    body: `13.1. Users may close their account at any time from the "My Account" page. Any orders in progress must be resolved before closure.

13.2. Toomny reserves the right to suspend or terminate an account in case of:
• Violation of these Terms;
• Fraud or attempted fraud;
• Abusive behavior toward other users or Toomny;
• False declaration during registration or KYC;
• Extended inactivity (account inactive for more than 24 months).

13.3. In case of termination for cause, escrowed amounts are handled according to the dispute procedure, and Toomny may retain its commission as damages.`,
  },
  {
    title: "14. Amendments to the Terms",
    body: `Toomny may amend these Terms at any time. Users are notified by email and/or in-app notification with 30 days' notice. Continued use of the Platform after this period constitutes acceptance of the new terms. In case of disagreement, the user may close their account.`,
  },
  {
    title: "15. Governing Law and Jurisdiction",
    body: `These Terms are governed by Ivorian law. Any dispute relating to their interpretation or execution shall be submitted to the competent courts of Abidjan (Côte d'Ivoire), subject to mandatory rules applicable in users' countries of residence.

For Providers and Clients established in other OHADA member states, OHADA rules on commercial contracts apply supplementarily.

For any questions regarding these Terms: support@toomny.com`,
  },
];

function renderBody(text: string) {
  return text.split("\n\n").map((para, i) => (
    <p key={i} className="mt-4 text-sm leading-relaxed text-[var(--subtle)] whitespace-pre-line">
      {para.split(/\*\*(.*?)\*\*/).map((part, j) =>
        j % 2 === 1 ? <strong key={j} className="font-semibold text-[var(--foreground)]">{part}</strong> : part
      )}
    </p>
  ));
}

export function CguBody({ locale = "fr" }: { locale?: Locale }) {
  const sections = locale === "en" ? EN_SECTIONS : FR_SECTIONS;
  const title = locale === "en" ? "Terms of Use" : "Conditions Générales d'Utilisation";
  const updated = locale === "en" ? "Last updated: October 2026" : "Dernière mise à jour : octobre 2026";

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-xs text-[var(--subtle)]">{updated}</p>

      <nav className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)] mb-2">
          {locale === "en" ? "Table of contents" : "Sommaire"}
        </p>
        <ol className="space-y-1">
          {sections.map((s, i) => (
            <li key={i}>
              <a
                href={`#section-${i}`}
                className="text-xs text-[var(--color-brand-600)] underline-offset-2 hover:underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={i} id={`section-${i}`}>
            <h2 className="font-display text-base font-bold">{s.title}</h2>
            {renderBody(s.body)}
          </section>
        ))}
      </div>

      <div className="mt-12 border-t border-[var(--border)] pt-8">
        <p className="text-xs text-[var(--subtle)]">
          {locale === "en"
            ? "Questions? Contact us at "
            : "Des questions ? Contactez-nous à "}
          <a href="mailto:support@toomny.com" className="underline underline-offset-2">support@toomny.com</a>
        </p>
        <p className="mt-4">
          <Link href="/" className="text-sm underline underline-offset-4 text-[var(--color-brand-600)]">
            {locale === "en" ? "← Back to home" : "← Retour à l'accueil"}
          </Link>
        </p>
      </div>
    </main>
  );
}
