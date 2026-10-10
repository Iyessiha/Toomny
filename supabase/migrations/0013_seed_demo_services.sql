-- ---------------------------------------------------------------------------
-- Données de démo : prestataire système + au moins 3 prestations par catégorie.
-- L'admin peut modifier, réassigner ou supprimer ces entrées via le dashboard
-- Supabase (Table Editor) ou un futur écran d'administration.
--
-- Prestataire démo : UUID fixe 11111111-1111-1111-1111-111111111111
-- ---------------------------------------------------------------------------

-- 1. Prestataire démo ---------------------------------------------------
INSERT INTO public.profiles (
  id, email, display_name, first_name, last_name,
  country_code, role, verification_status
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'demo@toomny.com',
  'Toomny Démo',
  'Toomny',
  'Démo',
  'CI',
  'provider',
  'verified'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Profil prestataire démo -------------------------------------------
INSERT INTO public.provider_profiles (profile_id, headline, bio, content_locale)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Prestations de démonstration — modifiable par l''admin',
  'Ces prestations sont des exemples illustrant le catalogue Toomny. Un administrateur peut les modifier, les réassigner à de vrais prestataires ou les supprimer depuis le dashboard Supabase.',
  'fr'
)
ON CONFLICT (profile_id) DO NOTHING;

-- 3. Nettoyage idempotent -----------------------------------------------
DELETE FROM public.services
WHERE provider_id = '11111111-1111-1111-1111-111111111111';

-- 4. Design graphique ---------------------------------------------------
INSERT INTO public.services
  (provider_id, category_id, title, description, price_minor, currency, delivery_days, content_locale, status)
SELECT
  '11111111-1111-1111-1111-111111111111',
  c.id,
  v.title,
  v.description,
  v.price_minor,
  'XOF',
  v.delivery_days,
  'fr',
  'active'
FROM public.categories c
CROSS JOIN (VALUES
  (
    'Création de logo professionnel',
    'Votre identité visuelle commence par un logo fort et mémorable. Je crée un logo unique et moderne adapté à votre secteur d''activité. Livraison en PNG, SVG et PDF avec 3 propositions initiales et 2 révisions incluses.',
    25000, 5
  ),
  (
    'Conception de flyer et affiche publicitaire',
    'Conception de flyers et affiches professionnelles pour vos événements, promotions ou campagnes commerciales. Format print haute résolution (300 dpi) et version digitale optimisée. Textes et contenu fournis par le client.',
    12000, 3
  ),
  (
    'Charte graphique complète',
    'Une charte graphique cohérente et professionnelle pour votre marque : logo principal et déclinaisons, palette de couleurs, typographies, iconographie et guide d''utilisation complet. Idéal pour les entreprises qui lancent ou repositionnent leur image.',
    85000, 10
  ),
  (
    'Design de packaging produit',
    'Création du design d''emballage pour vos produits locaux : boîte, sachet, étiquette bouteille ou pot. Fichiers vectoriels prêts pour l''impression. Inclut jusqu''à 2 formats d''emballage et des retouches jusqu''à validation finale.',
    45000, 7
  )
) AS v(title, description, price_minor, delivery_days)
WHERE c.slug = 'design-graphique';

-- 5. Développement web --------------------------------------------------
INSERT INTO public.services
  (provider_id, category_id, title, description, price_minor, currency, delivery_days, content_locale, status)
SELECT
  '11111111-1111-1111-1111-111111111111',
  c.id,
  v.title,
  v.description,
  v.price_minor,
  'XOF',
  v.delivery_days,
  'fr',
  'active'
FROM public.categories c
CROSS JOIN (VALUES
  (
    'Site vitrine WordPress responsive',
    'Création de votre site vitrine professionnel sur WordPress : présentation de vos services, formulaire de contact, galerie photos. Optimisé pour mobile et visible sur Google. Inclut 5 pages, formulaire de contact et une formation à la prise en main d''une heure.',
    120000, 14
  ),
  (
    'Landing page sur mesure',
    'Une page d''atterrissage percutante pour convertir vos visiteurs : lancement de produit, collecte de leads ou promotion saisonnière. Design moderne, chargement rapide, compatible mobile, avec intégration Google Analytics et un formulaire de capture.',
    65000, 7
  ),
  (
    'Boutique en ligne WooCommerce',
    'Votre boutique e-commerce clé en main sur WooCommerce : catalogue produits, panier, paiement en ligne et gestion des commandes. Jusqu''à 20 produits, configuration du paiement mobile money et formation à la gestion du catalogue.',
    250000, 21
  ),
  (
    'Application web React / Next.js',
    'Développement d''une application web légère et moderne : tableau de bord, formulaire métier ou outil interne. Technologies React/Next.js, authentification utilisateur, base de données et déploiement sur Vercel inclus.',
    180000, 21
  )
) AS v(title, description, price_minor, delivery_days)
WHERE c.slug = 'developpement-web';

-- 6. Community management -----------------------------------------------
INSERT INTO public.services
  (provider_id, category_id, title, description, price_minor, currency, delivery_days, content_locale, status)
SELECT
  '11111111-1111-1111-1111-111111111111',
  c.id,
  v.title,
  v.description,
  v.price_minor,
  'XOF',
  v.delivery_days,
  'fr',
  'active'
FROM public.categories c
CROSS JOIN (VALUES
  (
    'Gestion réseaux sociaux — 1 mois complet',
    'Gestion complète de vos pages Facebook et Instagram pendant un mois : création des visuels, rédaction des légendes, publication et modération des commentaires. 12 publications par mois, Stories et Reels inclus, avec rapport mensuel de performance.',
    60000, 30
  ),
  (
    'Calendrier éditorial mensuel',
    'Élaboration d''un calendrier éditorial sur mesure pour vos réseaux sociaux : thèmes, types de contenu, jours et heures de publication optimaux. Livré en format Excel ou Notion, avec 30 idées de posts et accroches rédigées, adapté à votre secteur.',
    20000, 3
  ),
  (
    'Pack 10 visuels pour réseaux sociaux',
    'Création de 10 visuels professionnels pour Instagram, Facebook ou LinkedIn : annonces produits, citations inspirantes, promotions. Aux couleurs de votre marque, livrés en PNG 1080×1080, optimisés pour chaque réseau avec une révision par visuel.',
    30000, 7
  )
) AS v(title, description, price_minor, delivery_days)
WHERE c.slug = 'community-management';

-- 7. Montage vidéo ------------------------------------------------------
INSERT INTO public.services
  (provider_id, category_id, title, description, price_minor, currency, delivery_days, content_locale, status)
SELECT
  '11111111-1111-1111-1111-111111111111',
  c.id,
  v.title,
  v.description,
  v.price_minor,
  'XOF',
  v.delivery_days,
  'fr',
  'active'
FROM public.categories c
CROSS JOIN (VALUES
  (
    'Montage réel Instagram et TikTok',
    'Montage de votre vidéo courte jusqu''à 60 secondes pour Instagram Reels ou TikTok : sous-titres animés, musique tendance, transitions dynamiques. Rendu 1080×1920 vertical et 1080×1080 carré, avec version musicale et version sans musique.',
    15000, 2
  ),
  (
    'Montage vidéo publicitaire',
    'Montage professionnel de votre publicité vidéo jusqu''à 3 minutes : spot TV, pub digitale ou vidéo de présentation d''entreprise. Inclut l''étalonnage des couleurs, habillage graphique avec vos titres et logo, mixage audio et export multi-formats.',
    45000, 5
  ),
  (
    'Générique et habillage vidéo de marque',
    'Création de votre identité vidéo complète : intro animée, outro, lower-thirds et transitions aux couleurs de votre marque. Package réutilisable sur toutes vos vidéos YouTube, Facebook et Instagram. Fichiers sources After Effects fournis.',
    35000, 4
  )
) AS v(title, description, price_minor, delivery_days)
WHERE c.slug = 'montage-video';

-- 8. Rédaction & traduction ----------------------------------------------
INSERT INTO public.services
  (provider_id, category_id, title, description, price_minor, currency, delivery_days, content_locale, status)
SELECT
  '11111111-1111-1111-1111-111111111111',
  c.id,
  v.title,
  v.description,
  v.price_minor,
  'XOF',
  v.delivery_days,
  'fr',
  'active'
FROM public.categories c
CROSS JOIN (VALUES
  (
    'Rédaction d''article de blog SEO (1 000 mots)',
    'Rédaction d''un article de blog optimisé pour les moteurs de recherche, de 1 000 mots, sur le sujet de votre choix. Texte original et structuré (H1, H2, H3) avec recherche de mots-clés incluse, méta-description fournie et livraison sous Word ou Google Docs.',
    8000, 2
  ),
  (
    'Traduction français ↔ anglais (1 000 mots)',
    'Traduction professionnelle français-anglais ou anglais-français de vos textes jusqu''à 1 000 mots : site web, e-mail commercial, document contractuel ou supports marketing. Traduction naturelle et idiomatique, relecture et correction incluses.',
    10000, 2
  ),
  (
    'Rédaction de fiches produit (lot de 5)',
    'Création de 5 fiches produit percutantes pour votre e-commerce ou catalogue papier : accroche, description complète, caractéristiques techniques et appel à l''action. Optimisées pour le référencement naturel et adaptées à votre clientèle cible en Afrique.',
    15000, 3
  ),
  (
    'Textes complets pour site web (5 pages)',
    'Rédaction de tous les textes de votre site internet : accueil, à propos, services, contact et une page au choix. Ton professionnel adapté à votre secteur, textes optimisés SEO de 500 à 800 mots par page, livrés sous Google Docs.',
    35000, 7
  )
) AS v(title, description, price_minor, delivery_days)
WHERE c.slug = 'redaction-traduction';

-- 9. Marketing digital ---------------------------------------------------
INSERT INTO public.services
  (provider_id, category_id, title, description, price_minor, currency, delivery_days, content_locale, status)
SELECT
  '11111111-1111-1111-1111-111111111111',
  c.id,
  v.title,
  v.description,
  v.price_minor,
  'XOF',
  v.delivery_days,
  'fr',
  'active'
FROM public.categories c
CROSS JOIN (VALUES
  (
    'Campagne publicitaire Meta Ads (Facebook & Instagram)',
    'Configuration et lancement de votre campagne publicitaire sur Facebook et Instagram : ciblage précis de votre audience locale, création des visuels et textes d''annonces, optimisation continue et rapport hebdomadaire. Budget publicitaire non inclus (minimum 25 000 FCFA).',
    75000, 7
  ),
  (
    'Audit SEO et plan d''action',
    'Analyse complète de votre site web et plan d''action détaillé pour améliorer votre positionnement sur Google Afrique : audit technique (vitesse, mobile), étude des mots-clés, analyse des backlinks et liste de recommandations prioritaires.',
    95000, 10
  ),
  (
    'Création et lancement campagne Google Ads',
    'Mise en place de votre campagne Google Ads (Search) pour attirer des clients locaux en Afrique de l''Ouest : sélection des mots-clés, rédaction des annonces, configuration des conversions et rapport de démarrage. Budget publicitaire non inclus.',
    80000, 7
  )
) AS v(title, description, price_minor, delivery_days)
WHERE c.slug = 'marketing-digital';

-- 10. Comptabilité & administration -------------------------------------
INSERT INTO public.services
  (provider_id, category_id, title, description, price_minor, currency, delivery_days, content_locale, status)
SELECT
  '11111111-1111-1111-1111-111111111111',
  c.id,
  v.title,
  v.description,
  v.price_minor,
  'XOF',
  v.delivery_days,
  'fr',
  'active'
FROM public.categories c
CROSS JOIN (VALUES
  (
    'Saisie comptable mensuelle',
    'Saisie de toutes vos opérations comptables du mois : achats, ventes, opérations bancaires. Livraison du journal comptable sous Excel ou sur votre logiciel (Sage, QuickBooks). Jusqu''à 100 écritures par mois, pointage bancaire et bilan mensuel inclus.',
    35000, 5
  ),
  (
    'Création de modèles devis et factures',
    'Mise en place de vos modèles de devis et factures professionnels conformes aux normes SYSCOHADA en vigueur en Afrique de l''Ouest. Fichiers Word/Excel personnalisés avec votre logo et couleurs, prêts à l''emploi, avec formation à l''utilisation.',
    15000, 2
  ),
  (
    'Assistance déclarations fiscales',
    'Préparation et accompagnement au dépôt de vos déclarations fiscales périodiques pour les entreprises au régime simplifié d''imposition en Côte d''Ivoire : TVA, impôt synthétique, patente. Calcul, vérification et archivage des justificatifs.',
    50000, 7
  )
) AS v(title, description, price_minor, delivery_days)
WHERE c.slug = 'comptabilite-admin';

-- 11. Photographie -------------------------------------------------------
INSERT INTO public.services
  (provider_id, category_id, title, description, price_minor, currency, delivery_days, content_locale, status)
SELECT
  '11111111-1111-1111-1111-111111111111',
  c.id,
  v.title,
  v.description,
  v.price_minor,
  'XOF',
  v.delivery_days,
  'fr',
  'active'
FROM public.categories c
CROSS JOIN (VALUES
  (
    'Shooting de produits — 10 photos retouchées',
    'Séance photo de vos produits en studio ou sur fond neutre : alimentation, mode, cosmétiques, artisanat local. 10 photos retouchées en haute résolution, prêtes pour votre site web ou vos réseaux sociaux. Livraison par lien de téléchargement WeTransfer.',
    35000, 3
  ),
  (
    'Portrait professionnel',
    'Séance photo portrait d''une heure pour votre profil LinkedIn, site web ou carte de visite professionnelle. 5 photos retouchées livrées sur fond uni ou en environnement naturel selon votre préférence. Conseils de pose et de tenues inclus.',
    20000, 2
  ),
  (
    'Couverture événementielle (demi-journée)',
    'Reportage photo professionnel de votre événement pendant 4 heures : conférence d''affaires, inauguration, cérémonie, anniversaire d''entreprise. 50 photos retouchées livrées en haute résolution via une galerie en ligne privée sécurisée.',
    65000, 2
  )
) AS v(title, description, price_minor, delivery_days)
WHERE c.slug = 'photographie';
