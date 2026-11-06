# Audit du design Toomny + proposition « Aurora Glass »

Document de travail. Il décrit ce qui fonctionne dans le design actuel, ce qui
le tire vers le bas, puis la direction proposée et son coût réel.

- Design actuel : `/`
- Proposition : `/design-glassy` (français) et `/en/design-glassy` (anglais)

Les deux pages tournent sur le même contenu (`src/content/landing.ts`) et le
même catalogue. Seule la couche visuelle change.

---

## 1. Ce que le design actuel fait très bien

À garder tel quel dans toute refonte :

1. **La charte est dérivée du logo**, pas plaquée dessus. Le vert `#108043` a été
   échantillonné sur le logo, la rampe `brand-50 → brand-900` est construite
   autour, l'or sert de secondaire (`src/app/globals.css`). C'est plus rare qu'il
   n'y paraît et ça se sent.
2. **La sobriété est un choix documenté** : polices auto-hébergées, aucune image
   décorative, JavaScript d'animation après le contenu, `prefers-reduced-motion`
   respecté jusqu'aux révélations au défilement.
3. **Le mode sombre est complet** : variables `--background`, `--surface`,
   `--tone-*` (pastilles de statut), pas un simple filtre inversé.
4. **L'accessibilité est traitée, pas promise** : sans JS rien n'est masqué,
   `:focus-visible` global, FAQ en `<details>`, `sr-only` sur les chiffres.
5. **La preuve sociale est honnête** : les compteurs ne s'affichent qu'au-dessus
   d'un seuil (`TRUST_THRESHOLDS`), plutôt que d'inventer un « +10 000 clients ».
6. **Le contenu est hors des composants** et rendu côté serveur, en deux langues.

## 2. Ce qui, à mon sens, affaiblit le design actuel

Par ordre d'impact.

1. **Trois directions visuelles cohabitent.** La charte est émeraude `#108043`,
   mais le hero utilise une autre rampe (`#22c55e`, gradient `#4ade80 → #86efac`
   dans `.gradient-text` et `.btn-landing-primary`), la section tarifs injecte du
   rose/orange (`#ff5f6d → #ffb547`, `pricing.tsx`) et une échelle de quatre
   couleurs (ardoise / émeraude / indigo / ambre, `pricing-scene.tsx`), les cartes
   de catégories utilisent huit dégradés différents (`src/lib/categories.ts`), et
   la carte du hero a un voile violet-cyan (`#6B46C1 → #0891B2`). Au bout de deux
   écrans, la marque n'est plus identifiable par sa couleur.
2. **Le verre est payé mais pas visible.** `.glass-panel` (blur 20px) n'apparaît
   que deux fois, dans le hero. Sur un fond blanc opaque, un verre à 85 %
   d'opacité ne laisse rien passer : le coût GPU est payé, l'effet est invisible.
   Il n'y a donc pas de « matière » entre le fond et les cartes.
3. **La landing et le produit ne parlent pas la même langue.** Les espaces
   connectés ont un vocabulaire fort (`.hero-band` vert-or, `texture-dots`
   bogolan, `btn-gold`, quatre ombres `--shadow-*`) qui n'existe nulle part sur
   la landing — et l'inverse est vrai. Un visiteur qui s'inscrit change d'univers.
4. **Le soin est concentré sur le premier écran.** Tilt 3D, vidéo, flottement,
   révélations dans le hero ; puis FAQ, appel final et pied de page strictement
   statiques. La page « s'éteint » à mesure qu'on descend.
5. **Une vidéo de 629 Ko pour un fond qu'on masque.** `hero.mp4` (629 Ko) et son
   poster (146 Ko) se chargent avant tout, puis sont recouverts d'un voile sombre
   à 78–85 % et d'une grille de points. C'est le point le plus cher de la page,
   sur le réseau qu'on dit vouloir ménager.
6. **Détails qui datent le style** : drapeaux emoji dans l'en-tête alors que tout
   le reste est dessiné en SVG ; flèches `→` en caractère texte à côté de flèches
   SVG ; jaune `#FFCB00` en dur pour les étoiles.
7. **Des largeurs de colonne incohérentes** : `max-w-7xl` pour catégories et
   prestations, `max-w-6xl` pour le hero, les tarifs et le pied de page. La
   colonne se décale pendant le défilement.
8. **Contrastes limites dans le hero** : `text-white/55` et le placeholder à 50 %
   sur une image variable passent sous 4,5:1 par endroits ; la pastille
   « En vedette » (`text-amber-600` sur `amber-500/10`) est juste à la limite.

## 3. La proposition : « Aurora Glass »

**L'idée, en une phrase :** si le produit vend un paiement *conservé en
transparence*, l'interface doit le montrer — des surfaces de verre qui laissent
voir la lumière du fond, et une seule famille de couleurs (l'émeraude et l'or de
la charte) dans toute la page.

### Ce qui change

| | Design actuel | Aurora Glass |
|---|---|---|
| Fond | blanc, puis cartes blanches | nuit verte `#04110b` + trois nappes d'aurore |
| Surfaces | bordures 1px, ombres douces | verre dépoli : `backdrop-filter`, arête lumineuse, reflet au survol |
| Couleurs d'accent | émeraude, orange, rose, violet, ambre | émeraude (`brand-300/400`) et or (`gold-400`) uniquement |
| Hero | vidéo 629 Ko + voile | pas de vidéo : nappes animées en CSS, coût ~0 |
| Rythme | hero animé, suite statique | chaque section a sa matière (verre, chiffres, tableau) |
| Détails | emojis, jaune en dur | icônes SVG du projet (`lucide`), or de la charte |

### Détails d'exécution

- **Un seul `backdrop-filter` par surface**, pas de flou imbriqué : c'est la
  version qui tient sur un mobile d'entrée de gamme.
- **L'arête lumineuse** (`.glass-edge`) est un dégradé masqué en `mask-composite`,
  donc pas d'image, pas de bordure en `box-shadow` bricolée.
- **Le grain** du verre est un SVG `feTurbulence` de 140 octets en data URI, à
  3,5 % d'opacité.
- **Les révélations** se font avec `IntersectionObserver`, et le masquage n'existe
  que si un script inline de 3 lignes pose la classe `js` — avec un minuteur qui
  la retire au bout de 3 s si le bundle ne charge pas. Aucun bloc ne peut rester
  invisible à cause d'une animation.
- **Menus et FAQ sans JavaScript** (`<details>`), donc rien ne casse si
  l'hydratation échoue.
- **Zéro dépendance ajoutée, zéro image décorative.** Le contenu vient de
  `src/content/landing.ts`, les vraies prestations du catalogue.
- **Contrastes** : tous les textes secondaires sont à ≥ 60 % de blanc sur le fond
  nocturne (≈ 7:1), les accents à `#9ff2c2` (≈ 10:1).

### Fichiers

- `src/app/(fr)/design-glassy/page.tsx` — la route
- `src/app/(fr)/design-glassy/glassy-landing.tsx` — la composition (sections)
- `src/app/(fr)/design-glassy/glassy.css` — le système de verre (aucun utilitaire
  nouveau n'est imposé au reste du site)
- `src/app/(fr)/design-glassy/glassy-effects.tsx` — reflet et parallaxe (facultatifs)
- `src/app/(en)/en/design-glassy/page.tsx` — version anglaise

### Ce que je ne recommande pas de faire d'un coup

Le verre ne se marie pas avec un fond blanc : appliquer cette direction
demanderait de passer **toute** l'application en fond nocturne, espaces connectés
compris. Trois façons d'y aller, de la moins chère à la plus engageante :

1. **Landing seulement** (faible risque) : garder le produit en clair, et faire de
   la landing une « vitrine de nuit ». C'est ce que montre `/design-glassy`.
2. **Tokens d'abord** : remplacer `.glass-panel` par le système ci-dessus et
   unifier les accents sur `brand`/`gold` — sans toucher aux mises en page. Cela
   corrige le point 1 de l'audit (les trois directions) pour un coût minime.
3. **Tout en sombre** : cohérent, mais il faut reprendre les tableaux de bord et
   les formulaires ; à planifier, pas à improviser.

---

## 4. Suite de la proposition (design validé)

La direction est validée. Ont été ajoutés, dans le même esprit :

### Images

Sept visuels générés pour la maquette, tous dans la même lumière (émeraude +
or, fond sombre, grain) : `public/images/glassy/`.

| Fichier | Usage |
|---|---|
| `design-graphique.jpg` | couverture de catégorie + carte prestation |
| `developpement-web.jpg` | idem |
| `montage-video.jpg` | idem |
| `community-management.jpg` | idem |
| `marketing-digital.jpg` | idem |
| `photographie.jpg` | idem |
| `avatars/*.jpg` (4) | portraits prestataires et pastilles de la maquette |

Ils servent uniquement la démonstration `/design-glassy`. Le vrai catalogue
continue d'utiliser `cover_url` (voir `src/components/catalog/cover-image.tsx`).

### Cartes

`src/app/(fr)/design-glassy/glassy-cards.tsx` — trois formats, un seul langage :

- **`GlassServiceCard`** — grille du catalogue : photo, catégorie, badge
  « Vedette », prestataire + KYC, prix et délai.
- **`GlassListCard`** — résultat de recherche horizontal : photo à gauche,
  prix et note à droite.
- **`GlassProviderCard`** — prestataire : portrait, présence en ligne, note,
  compétences, nombre de commandes.

Règles communes : un seul `backdrop-filter` par carte, voile sombre sous le
texte posé sur la photo (lisibilité garantie quelle que soit l'image).

### Tableaux de bord

`/design-glassy/dashboards?role=client|prestataire|admin`

Trois rôles, une seule coquille (barre latérale de verre, barre supérieure,
contenu). Le sélecteur de rôle est fait de liens — aucun état client.

- **Client** : dépenses, commandes en cours avec bouton « Valider la livraison »,
  reprises de prestations, messages, rappel des garanties.
- **Prestataire** : encaissements (histogramme CSS, pas de librairie de
  graphiques), encart de versement avec le détail des frais (5 % + 1 %),
  commandes à traiter, relance « prestations sans photo », boost.
- **Administration** : volume, commissions, litiges, vérifications, courbe en
  SVG, dernières commandes.

Les données sont fictives (`glassy-demo.ts`) mais le vocabulaire, les statuts et
les montants suivent le modèle réel du site.

### Repli sans JavaScript

Le sélecteur de rôle, le menu mobile, la FAQ, les onglets et le filtre de
catalogue sont tous en HTML natif ou en liens. Aucune maquette ne dépend d'un
état client pour s'afficher.

---

## 5. Composition par métier (référence ComeUp)

La référence fournie (page d'accueil ComeUp) apporte un motif que la maquette
n'avait pas : **chaque rubrique métier est un bloc de texte à gauche, une
mosaïque de portraits à droite, puis deux ou trois cartes de prestations.**
Le visage fait le travail qu'aucune illustration abstraite ne fait.

Reproduit en `glassy-trades.tsx`, en gardant le verre émeraude validé :

| Élément | Référence | Maquette |
|---|---|---|
| Mosaïque de portraits | photos en vrac, inclinées | 6 portraits, rotations de −6° à +9°, halo émeraude derrière |
| Cartes | visuel + titre + prix | visuel recadré différemment par carte + teinte propre, prestataire en incrustation, prix et délai |
| Sections | une par métier, très aérées | 4 sections : design, web, marketing, image & vidéo |
| Témoignages | 8 cartes empilées | 4 cartes en verre : auteur, métier, note, avis |
| Bandeau prestataires | absent chez ComeUp | 6 prestataires en fin de page |

Points d'exécution :

- La mosaïque est **masquée sous 1024 px** : sur mobile les cartes suffisent,
  et la page reste légère sur un réseau lent.
- Les trois cartes d'une même section partagent souvent une photo : elles sont
  donc **recadrées et teintées différemment** (`pos` et `tint`), sinon la
  répétition se voit immédiatement.
- Onze portraits au total (`public/images/glassy/avatars/`), tirés au sort par
  métier via `CATEGORY_FACES`, pour que deux sections voisines ne montrent pas
  les mêmes visages.
- Le contenu des témoignages suit le ton du site (« avis laissés après une
  commande terminée uniquement »), pas une promesse marketing.

### Ce qui n'a pas été repris de la référence

- La vidéo de fond du hero : c'est justement le point de l'audit (629 Ko de
  vidéo recouverte à 80 %). Les nappes d'aurore en CSS coûtent ~0.
- Les cartes « jeu de cartes » empilées : très joli, mais chaque carte est une
  image à charger, et le prix se paie sur le premier écran.
- Le bandeau de logos de paiement en couleur pleine : la maquette garde les
  pastilles rondes, plus sobres sur fond nocturne.
