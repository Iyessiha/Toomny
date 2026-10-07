# Toomny

Marketplace de talents pour l'Afrique de l'Ouest. Les PME recrutent des prestataires du continent, paient en mobile money, et les fonds restent sécurisés jusqu'à la livraison.

**Domaine** : toomny.com · **Statut** : structure posée, produit en attente de la Phase 0.

---

## État du projet

Le code de ce dépôt est un **squelette d'architecture**, pas un produit. L'étude de marché conclut que cinq hypothèses doivent être validées en entretien avant de construire, dont deux peuvent imposer une conception entièrement différente. Ce qui est posé ici est ce qui ne changera pas quelle qu'en soit l'issue : le modèle monétaire, la machine à états du séquestre, le journal comptable et l'i18n.

Rien ne doit être développé au-delà avant la fin de la Phase 0.

## Les trois règles d'architecture

Elles sortent directement de l'étude de marché et ne sont pas négociables.

### 1. Nous ne détenons jamais les fonds

En zone UEMOA, la détention de fonds du public est réservée aux banques, établissements financiers de paiement, SFD autorisés et établissements de monnaie électronique agréés par la BCEAO. Les agrégateurs de paiement n'ont pas de cadre propre et sont traités comme prestataires techniques.

Conséquence : le séquestre est **porté par un partenaire agréé**. `escrow_holds` n'est qu'un miroir local de l'état côté partenaire, et aucune colonne du schéma ne représente un solde détenu par Toomny. Voir [`src/lib/payments/types.ts`](src/lib/payments/types.ts).

### 2. Multi-devises dès le départ

Tout montant est un entier dans la plus petite unité de la devise, jamais un flottant. Le XOF n'a pas de subdivision — exponent 0 — contrairement à l'USD. L'interface n'expose que le XOF en phase 1 ; la base est déjà prête pour le cedi, le naira et le dollar. Voir [`src/lib/money.ts`](src/lib/money.ts).

### 3. Journal comptable en ajout seul

`ledger_entries` n'est jamais modifié ni supprimé ; une correction se fait par une écriture inverse. Ce journal conditionne l'attestation de revenus et l'avance sur mission, les deux produits financiers qui porteront la marge réelle. Sans journal propre dès la première transaction, ils ne sont pas construisibles plus tard. Voir [`src/lib/ledger.ts`](src/lib/ledger.ts).

## Contraintes de conception

- **Mobile d'abord, réseau lent d'abord.** Plus de 90 % du trafic viendra d'un téléphone, souvent en 3G. Pas de police distante, pas d'image décorative, pas de parcours à plus de trois écrans.
- **Bilingue FR/EN nativement.** Aucune chaîne de texte en dur dans un composant, dès le premier commit. Le français est la langue de lancement, l'anglais sert l'ouverture du marché anglophone en phase 2.
- **Wave par défaut pour les versements** : gratuit à la réception pour le prestataire.

## Modèle économique encodé

| Paramètre | Valeur | Où |
| --- | --- | --- |
| Commission prestataire | 10 % (1000 bps) | `DEFAULT_COMMISSION_BPS` |
| Commission client | 0 % | — |
| Délai de versement annoncé | 24 h | `PAYOUT_SLA_HOURS` |
| Validation automatique après livraison | 72 h | `AUTO_RELEASE_AFTER_DELIVERY_HOURS` |

L'arrondi de la commission se fait toujours au détriment de la plateforme, jamais du prestataire.

## Stack

Next.js 16 · React 19 · Tailwind 4 · TypeScript · Supabase (PostgreSQL) · Drizzle ORM · Vercel.

Identique à GeniusCrea et GeniusVoice, pour mutualiser le savoir-faire et les composants.

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplir
npm run db:push              # applique le schéma Drizzle
npm run dev
```

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sans émission |
| `npm run db:push` | pousse le schéma vers la base |
| `npm run db:generate` | génère les migrations |

## Structure

```
src/
├── app/            routes Next.js (App Router)
│   ├── services/   catalogue de prestations
│   ├── orders/     commandes et séquestre
│   ├── messages/   échange lié à une commande
│   ├── disputes/   arbitrage de litige
│   └── api/        webhooks paiement, versements
├── db/
│   ├── schema.ts   schéma Drizzle complet
│   └── index.ts    client
├── i18n/           dictionnaires FR/EN
└── lib/
    ├── money.ts    arithmétique monétaire en entiers
    ├── escrow.ts   machine à états de la commande
    ├── ledger.ts   journal en ajout seul
    ├── payments/   contrat PaymentProvider + GeniusPay
    └── supabase/   clients serveur et navigateur
```

## À faire avant de coder plus loin

- [ ] Consultation juridique sur la qualification du séquestre (instruction BCEAO n°001-01-2024)
- [ ] Accord écrit d'un partenaire agréé pour porter la rétention de fonds
- [ ] 50 entretiens : 30 prestataires, 20 PME, sur une seule ville
- [ ] Choix du trio de métiers à ouvrir, issu des entretiens
