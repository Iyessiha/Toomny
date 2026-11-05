import "server-only";
import { getLanding } from "@/content/landing";
import { getLegalTexts } from "@/content/legal";
import type { Locale } from "@/i18n/dictionaries";

/**
 * Connaissance du site injectée dans les prompts de l'assistant : fonctionnement,
 * FAQ et conditions. Construite à partir des contenus du site pour rester
 * synchronisée avec eux (pas de copie à maintenir à la main).
 */

const HOW_IT_WORKS = `FONCTIONNEMENT DE TOOMNY
- Toomny est une place de marché de prestations de services pour l'Afrique de l'Ouest. Les clients achètent, les prestataires vendent.
- Création de compte : inscription, puis confirmation de l'adresse e-mail par lien. Sans e-mail confirmé, l'espace reste fermé.
- Un prestataire doit vérifier son identité (pièce d'identité, dans « Vérification »). Tant que l'identité n'est pas vérifiée, ses prestations restent en brouillon et ne sont pas publiées.
- Publication : une prestation créée est en brouillon, puis soumise à la modération de l'équipe avant publication.
- Plans prestataires : Débutant (gratuit, 2 prestations, commission 10 %), Essentiel (10 000 FCFA/mois, 8 prestations, 8 %), Pro (15 000 FCFA/mois, 20 prestations, 5 %), Expert (25 000 FCFA/mois, 50 prestations, 3 %). L'assistant IA du profil et des prestations est inclus dans les plans payants.
- Paiement : le client paie la commande, les fonds sont retenus (séquestre) jusqu'à la livraison. Le client valide la livraison ; sans action de sa part, la validation est automatique au bout de 72 h, pour qu'un client inactif ne bloque pas le revenu du prestataire.
- Litige : le client peut ouvrir un litige avant de valider ; l'équipe Toomny tranche selon les messages et les livrables conservés sur la plateforme.
- Versements : mobile money, après vérification du compte de versement.
- Support : la messagerie « Contacter Toomny » dans l'espace connecté. Pour un litige sur une commande, passer par la commande.
- Captures d'écran : PNG, JPEG ou WebP, 5 Mo maximum, 4 images par message. Elles sont supprimées dès que la demande est résolue.`;

const RULES_FOR_REPLIES = `RÈGLES POUR LES RÉPONSES
- Ne promets jamais un remboursement, un délai de validation d'identité, une publication ou une décision de litige : l'équipe décide.
- Si le compte ne remplit pas une condition, dis précisément laquelle, et comment la remplir, en t'appuyant sur l'état du compte fourni.
- Pour un problème technique, demande une capture d'écran et le nom de l'écran ou de l'action.`;

function flatten(sections: { heading: string; paragraphs: string[] }[], maxChars: number): string {
  const out: string[] = [];
  let size = 0;
  for (const s of sections) {
    const block = `## ${s.heading}\n${s.paragraphs.join("\n")}`;
    if (size + block.length > maxChars) break;
    out.push(block);
    size += block.length;
  }
  return out.join("\n\n");
}

/** Politiques et FAQ, selon la langue de la réponse. Borné pour limiter le coût de chaque appel. */
export function toomnyKnowledge(locale: Locale): string {
  const legal = getLegalTexts(locale);
  const faq = getLanding(locale).faq.items.map((item) => `Q : ${item.q}\nR : ${item.a}`).join("\n\n");
  const cgu = flatten(legal.cgu.sections, 14_000);
  return [
    HOW_IT_WORKS,
    RULES_FOR_REPLIES,
    `FAQ\n${faq}`,
    `CONDITIONS GÉNÉRALES D'UTILISATION (extraits)\n${cgu}`,
  ].join("\n\n");
}
