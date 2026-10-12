# Toomny

Marketplace de talents pour l'Afrique de l'Ouest. Les PME recrutent des prestataires du continent, paient en mobile money, et les fonds restent sécurisés jusqu'à la livraison.

**Domaine** : toomny.com · **Statut** : produit fonctionnel en français, anglais prêt sur les parcours connectés.

---

## État du projet

Le parcours complet tourne : catalogue public avec forfaits et avis, commande, paiement mobile money via GeniusPay (encaissement), séquestre miroir, messagerie temps réel, litiges avec arbitrage admin, KYC avec recours humain, profils prestataires, versements en file manuelle, et back-office (commandes, litiges, KYC, utilisateurs, prestations, catégories).

Ce qui est posé depuis le premier commit et ne change pas : le modèle monétaire (entiers, multi-devises), la machine à états du séquestre, le journal comptable en ajout seul, et l'i18n FR/EN sans chaîne en dur.

## Les trois règles d'architecture

Elles sortent directement de l'étude de marché et ne sont pas négociables.

### 1. Nous ne détenons jamais les fonds

En zone UEMOA, la détention de fonds du public est réservée aux banques, établissements financiers de paiement, SFD autorisés et établissements de monnaie électronique agréés par la BCEAO. Les agrégateurs de paiement n'ont pas de cadre propre et sont traités comme prestataires techniques.

Conséquence : le séquestre est **porté par un partenaire agréé**. `escrow_holds` n'est qu'un miroir local de l'état côté partenaire, et aucune colonne du schéma ne représente un solde détenu par Toomny. Voir [`src/lib/payments/types.ts`](src/lib/payments/types.ts).

### 2. Multi-devises dès le départ

Tout montant est un entier dans la plus petite unité de la devise, jamais un flottant. Le XOF n'a pas de subdivision — exponent 0 — contrairement à l'USD. L'interface n'expose que le XOF en phase 1 ; la base est déjà prête pour le cedi, le naira et le dollar. Voir [`src/lib/money.ts`](src/lib/money.ts).

### 3. Journal comptable en ajout seul

`ledger_entries` n'est jamais modifié ni supprimé (trigger en base, y compris pour la clé service) ; une correction se fait par une écriture inverse. Ce journal conditionne l'attestation de revenus et l'avance sur mission, les deux produits financiers qui porteront la marge réelle. Voir [`src/lib/order-ledger.ts`](src/lib/order-ledger.ts).

## Contraintes de conception

- **Mobile d'abord, réseau lent d'abord.** Plus de 90 % du trafic viendra d'un téléphone, souvent en 3G. Polices auto-hébergées au build (zéro requête distante au runtime), pas d'image décorative, pas de parcours à plus de trois écrans.
- **Bilingue FR/EN nativement.** Aucune chaîne de texte en dur dans un composant. Les pages connectées suivent la langue du profil ; les pages publiques suivent le cookie de langue.
- **Wave par défaut pour les versements** : gratuit à la réception pour le prestataire.

## Modèle économique encodé

| Paramètre | Valeur | Où |
| --- | --- | --- |
| Commission prestataire | 10 % (1000 bps) | `DEFAULT_COMMISSION_BPS` |
| Commission client | 0 % | — |
| Délai de versement annoncé | 24 h | `PAYOUT_SLA_HOURS` |
| Validation automatique après livraison | 72 h | `AUTO_RELEASE_AFTER_DELIVERY_HOURS` (tâche quotidienne 06:00 UTC, délai effectif 72–96 h) |

L'arrondi de la commission se fait toujours au détriment de la plateforme, jamais du prestataire.

## Stack

Next.js 16 · React 19 · Tailwind 4 · TypeScript · Supabase (PostgreSQL + Auth + Storage + Realtime) · Drizzle (DDL uniquement) · Vercel.

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplir
npm run db:push              # crée les tables depuis src/db/schema.ts
# puis, dans l'éditeur SQL Supabase (projet de test d'abord), jouer DANS L'ORDRE :
#   supabase/migrations/0001_security_rls.sql       # RLS, journal immuable, bucket KYC
#   supabase/migrations/0002_…_0010_…               # stats admin, trigger, rate limits, audit, realtime…
#   supabase/migrations/0011_…_0020_…               # couvertures, galerie, tags, forfaits, inquiries, réparations
npm run dev
```

> ⚠️ Sans les migrations, la base n'a aucune politique d'accès : la clé anonyme publique donnerait accès à toutes les tables. Chaque fichier est rejouable sans risque (`if not exists`, `drop … if exists`).

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sans émission |
| `npm run test` | Vitest (logique métier, i18n, sécurité) |
| `npm run db:push` | pousse le schéma Drizzle vers la base (DDL uniquement) |
| `npm run db:generate` | génère les migrations Drizzle |

L'accès aux données passe par le client Supabase (`@/lib/supabase/server` en session, `@/lib/supabase/admin` côté serveur après contrôle explicite) ; Drizzle ne sert qu'à créer le schéma, jamais à requêter.

## Structure

```
src/
├── app/
│   ├── (fr)/         parcours français : landing, catalogue, commandes,
│   │                 messages, litiges, dashboard, back-office /admin
│   ├── (en)/en       version anglaise : accueil, auth, CGU
│   └── api/          auth, paiements, webhooks GeniusPay, uploads, export RGPD, cron 72 h
├── components/       landing, catalogue, commandes, dashboard, admin, auth
├── content/          contenus éditoriaux (landing, CGU)
├── db/schema.ts      schéma Drizzle, source du DDL (jamais requêté)
├── i18n/             dictionnaires FR/EN par domaine
├── lib/
│   ├── money.ts      arithmétique monétaire en entiers
│   ├── escrow.ts     machine à états de la commande
│   ├── order-ledger.ts  écritures du journal + compteurs prestataire
│   ├── packages.ts   validation des forfaits
│   ├── payments/     contrat PaymentProvider + GeniusPay
│   └── supabase/     clients session, navigateur et service
└── proxy.ts          CSP + langue + rafraîchissement de session
supabase/migrations/ RLS, fonctions SQL, buckets, seeds de démo
```

## Points ouverts connus

- **Versements** : l'API marchand GeniusPay n'expose pas de payout. Les demandes créent des lignes `queued`, pilotées dans `/admin/payouts` (prise en charge → paiement mobile money hors app → marquage payé/échec, avec écritures `payout`/`refund` au journal). Reste : le payout automatique quand un partenaire l'exposera.
- **Demandes de contact** : lues et répondues dans `/demandes` (conversations par prestation, accusés de lecture), avec notification in-app à chaque message. Reste : notifier hors app (e-mail ou push) — aucun canal externe pour l'instant.
- **Parité EN** : toute la vitrine suit le cookie de langue (`/en*` = points d'entrée anglais garantis, `lang`/hreflang dynamiques, sitemap + robots). Le login et le sélecteur du header synchronisent `preferred_locale` dans les deux sens. Choix assumé : pas de miroirs `/en/*` pour les pages internes (coût SEO/maintenance) — réévaluer à l'expansion anglophone.
- **Juridique** : qualification du séquestre (instruction BCEAO n°001-01-2024) et accord écrit du partenaire de rétention, toujours à obtenir.
