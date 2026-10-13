-- Migration 0025 : seed complet des catégories + table skills prédéfinis

-- ─── Catégories ──────────────────────────────────────────────────────────────

INSERT INTO categories (slug, name_fr, name_en, position, is_active) VALUES
  ('design-graphique',          'Design & Création graphique',    'Design & Graphic Creation',      1,  true),
  ('developpement-web',         'Développement web',              'Web Development',                2,  true),
  ('community-management',      'Community Management',           'Community Management',           3,  true),
  ('montage-video',             'Montage vidéo',                  'Video Editing',                  4,  true),
  ('redaction-traduction',      'Rédaction & Traduction',         'Writing & Translation',          5,  true),
  ('marketing-digital',         'Marketing digital',              'Digital Marketing',              6,  true),
  ('comptabilite-admin',        'Comptabilité & Administration',  'Accounting & Admin',             7,  true),
  ('photographie',              'Photographie',                   'Photography',                    8,  true),
  ('musique-audio',             'Musique & Audio',                'Music & Audio',                  9,  true),
  ('mode-textile-artisanat',    'Mode, Textile & Artisanat',      'Fashion, Textile & Crafts',      10, true),
  ('evenementiel',              'Événementiel',                   'Events',                         11, true),
  ('formation-coaching',        'Formation & Coaching',           'Training & Coaching',            12, true),
  ('intelligence-artificielle', 'Intelligence Artificielle',      'Artificial Intelligence',        13, true),
  ('business-conseil',          'Business & Conseil',             'Business & Consulting',          14, true),
  ('traduction-interpretation', 'Traduction & Interprétariat',    'Translation & Interpreting',     15, true),
  ('voix-off-podcast',          'Voix off & Podcast',             'Voice-over & Podcast',           16, true),
  ('animation-motion',          'Animation & Motion Design',      'Animation & Motion Design',      17, true),
  ('developpement-mobile',      'Développement mobile',           'Mobile Development',             18, true),
  ('maintenance-reparation',    'Maintenance & Réparation',       'Maintenance & Repair',           19, true),
  ('cours-soutien-scolaire',    'Cours & Soutien scolaire',       'Tutoring & School Support',      20, true),
  ('gastronomie-traiteur',      'Gastronomie & Traiteur',         'Catering & Food',                21, true),
  ('bien-etre-sante',           'Bien-être & Santé',              'Wellness & Health',              22, true),
  ('immobilier',                'Immobilier',                     'Real Estate',                    23, true)
ON CONFLICT (slug) DO UPDATE SET
  name_fr   = EXCLUDED.name_fr,
  name_en   = EXCLUDED.name_en,
  position  = EXCLUDED.position,
  is_active = true;

-- ─── Table des skills prédéfinis ─────────────────────────────────────────────
-- Crée la table si elle n'existe pas, puis insère les skills.

CREATE TABLE IF NOT EXISTS predefined_skills (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category   text NOT NULL,
  name_fr    text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0
);

ALTER TABLE predefined_skills ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les skills prédéfinis
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'predefined_skills' AND policyname = 'skills_public_read'
  ) THEN
    CREATE POLICY skills_public_read ON predefined_skills FOR SELECT USING (true);
  END IF;
END $$;

TRUNCATE predefined_skills;

INSERT INTO predefined_skills (category, name_fr, sort_order) VALUES
  -- Design & Création
  ('design-graphique', 'Logo & Identité visuelle', 1),
  ('design-graphique', 'Flyer & Affiche', 2),
  ('design-graphique', 'Charte graphique', 3),
  ('design-graphique', 'Packaging', 4),
  ('design-graphique', 'Carte de visite', 5),
  ('design-graphique', 'Bannière réseaux sociaux', 6),
  ('design-graphique', 'Infographie', 7),
  ('design-graphique', 'Illustration', 8),
  ('design-graphique', 'Design UI/UX', 9),
  ('design-graphique', 'Maquette (Figma/XD)', 10),
  ('design-graphique', 'Motion design', 11),
  ('design-graphique', '3D & Modélisation', 12),
  ('design-graphique', 'Design textile (wax, bogolan)', 13),
  ('design-graphique', 'Calligraphie & Typographie', 14),
  -- Développement web
  ('developpement-web', 'HTML / CSS', 1),
  ('developpement-web', 'React / Next.js', 2),
  ('developpement-web', 'Vue.js', 3),
  ('developpement-web', 'Node.js / Express', 4),
  ('developpement-web', 'PHP / Laravel', 5),
  ('developpement-web', 'WordPress', 6),
  ('developpement-web', 'Shopify / E-commerce', 7),
  ('developpement-web', 'Python / Django', 8),
  ('developpement-web', 'API REST / GraphQL', 9),
  ('developpement-web', 'Base de données (SQL, MongoDB)', 10),
  ('developpement-web', 'DevOps / Docker', 11),
  ('developpement-web', 'Cybersécurité', 12),
  -- Mobile
  ('developpement-mobile', 'Flutter', 1),
  ('developpement-mobile', 'React Native', 2),
  ('developpement-mobile', 'Android (Kotlin / Java)', 3),
  ('developpement-mobile', 'iOS (Swift)', 4),
  -- Marketing
  ('marketing-digital', 'Publicité Facebook & Instagram', 1),
  ('marketing-digital', 'Publicité Google Ads', 2),
  ('marketing-digital', 'TikTok Ads', 3),
  ('marketing-digital', 'SEO (référencement naturel)', 4),
  ('marketing-digital', 'Email Marketing', 5),
  ('marketing-digital', 'Copywriting & Texte persuasif', 6),
  ('marketing-digital', 'Stratégie de contenu', 7),
  ('marketing-digital', 'Marketing d''influence', 8),
  ('marketing-digital', 'Growth Hacking', 9),
  -- Community management
  ('community-management', 'Gestion page Facebook / Instagram', 1),
  ('community-management', 'Gestion compte TikTok', 2),
  ('community-management', 'Gestion compte LinkedIn', 3),
  ('community-management', 'Calendrier éditorial', 4),
  ('community-management', 'Modération & Service client', 5),
  -- Rédaction
  ('redaction-traduction', 'Rédaction d''articles de blog', 1),
  ('redaction-traduction', 'Copywriting publicitaire', 2),
  ('redaction-traduction', 'Ghostwriting', 3),
  ('redaction-traduction', 'Script vidéo / Podcast', 4),
  ('redaction-traduction', 'Communiqué de presse', 5),
  ('redaction-traduction', 'Rédaction de contrats', 6),
  ('redaction-traduction', 'Business Plan', 7),
  -- Traduction
  ('traduction-interpretation', 'Traduction Français ↔ Anglais', 1),
  ('traduction-interpretation', 'Traduction Français ↔ Arabe', 2),
  ('traduction-interpretation', 'Traduction Français ↔ Wolof', 3),
  ('traduction-interpretation', 'Traduction Français ↔ Dioula / Bambara', 4),
  ('traduction-interpretation', 'Traduction Français ↔ Haoussa', 5),
  ('traduction-interpretation', 'Interprétariat en conférence', 6),
  ('traduction-interpretation', 'Relecture & Correction', 7),
  -- Montage vidéo
  ('montage-video', 'Montage vidéo (Premiere, DaVinci)', 1),
  ('montage-video', 'Réels & Shorts', 2),
  ('montage-video', 'Sous-titrage', 3),
  ('montage-video', 'Vidéo promotionnelle', 4),
  ('montage-video', 'Étalonnage', 5),
  -- Musique
  ('musique-audio', 'Production musicale (Afrobeats, Coupé-décalé…)', 1),
  ('musique-audio', 'Mixage & Mastering', 2),
  ('musique-audio', 'Jingle & Musique publicitaire', 3),
  ('musique-audio', 'Podcast (montage & production)', 4),
  ('musique-audio', 'Sound design', 5),
  ('musique-audio', 'Transcription audio', 6),
  -- Voix off
  ('voix-off-podcast', 'Voix off française', 1),
  ('voix-off-podcast', 'Voix off anglaise', 2),
  ('voix-off-podcast', 'Doublage', 3),
  ('voix-off-podcast', 'Jingle radio', 4),
  -- Animation
  ('animation-motion', 'Animation 2D (After Effects)', 1),
  ('animation-motion', 'Animation 3D (Blender)', 2),
  ('animation-motion', 'Vidéo explainer', 3),
  ('animation-motion', 'Intro / Outro YouTube', 4),
  -- Photographie
  ('photographie', 'Photographie produits', 1),
  ('photographie', 'Photographie événementielle', 2),
  ('photographie', 'Portraits', 3),
  ('photographie', 'Retouche photo (Photoshop, Lightroom)', 4),
  ('photographie', 'Photographie de mode', 5),
  -- Comptabilité
  ('comptabilite-admin', 'Saisie comptable', 1),
  ('comptabilite-admin', 'Facturation', 2),
  ('comptabilite-admin', 'Déclaration fiscale', 3),
  ('comptabilite-admin', 'Assistanat administratif', 4),
  ('comptabilite-admin', 'Secrétariat', 5),
  -- Business
  ('business-conseil', 'Business Plan', 1),
  ('business-conseil', 'Étude de marché', 2),
  ('business-conseil', 'Présentation PowerPoint', 3),
  ('business-conseil', 'Gestion de projet (PMO)', 4),
  ('business-conseil', 'Levée de fonds / Pitch deck', 5),
  ('business-conseil', 'Conseil en stratégie', 6),
  -- Formation
  ('formation-coaching', 'Coaching de vie', 1),
  ('formation-coaching', 'Coaching entrepreneurial', 2),
  ('formation-coaching', 'Formation informatique', 3),
  ('formation-coaching', 'Soutien scolaire', 4),
  ('formation-coaching', 'Cours en ligne (e-learning)', 5),
  ('formation-coaching', 'Mentorat', 6),
  -- Mode & Artisanat
  ('mode-textile-artisanat', 'Couture & Confection', 1),
  ('mode-textile-artisanat', 'Broderie', 2),
  ('mode-textile-artisanat', 'Teinture (Tie-dye, Batik)', 3),
  ('mode-textile-artisanat', 'Tissage (Kente, Bogolan)', 4),
  ('mode-textile-artisanat', 'Maroquinerie', 5),
  ('mode-textile-artisanat', 'Bijouterie artisanale', 6),
  ('mode-textile-artisanat', 'Stylisme & Conseil mode', 7),
  -- Événementiel
  ('evenementiel', 'Organisation de mariage', 1),
  ('evenementiel', 'Organisation de conférence', 2),
  ('evenementiel', 'Décoration événementielle', 3),
  ('evenementiel', 'DJ & Sonorisation', 4),
  ('evenementiel', 'Animation de soirée (MC)', 5),
  ('evenementiel', 'Photographie événementielle', 6),
  ('evenementiel', 'Vidéographie événementielle', 7),
  -- IA
  ('intelligence-artificielle', 'Prompt Engineering (ChatGPT, Claude…)', 1),
  ('intelligence-artificielle', 'Automatisation avec IA (n8n, Zapier)', 2),
  ('intelligence-artificielle', 'Création de chatbots', 3),
  ('intelligence-artificielle', 'Génération d''images (Midjourney, DALL-E)', 4),
  ('intelligence-artificielle', 'Formation à l''IA', 5),
  ('intelligence-artificielle', 'Agents IA', 6),
  -- Maintenance
  ('maintenance-reparation', 'Réparation téléphones', 1),
  ('maintenance-reparation', 'Support informatique', 2),
  ('maintenance-reparation', 'Réparation électroménager', 3),
  ('maintenance-reparation', 'Installation réseau / Wi-Fi', 4),
  -- Bien-être
  ('bien-etre-sante', 'Coaching sportif', 1),
  ('bien-etre-sante', 'Nutrition & Diététique', 2),
  ('bien-etre-sante', 'Méditation & Mindfulness', 3),
  ('bien-etre-sante', 'Soins beauté & Coiffure', 4),
  -- Gastronomie
  ('gastronomie-traiteur', 'Traiteur & Restauration événementielle', 1),
  ('gastronomie-traiteur', 'Cuisine africaine', 2),
  ('gastronomie-traiteur', 'Livraison de repas', 3),
  ('gastronomie-traiteur', 'Formation cuisine', 4),
  -- Cours scolaires
  ('cours-soutien-scolaire', 'Mathématiques', 1),
  ('cours-soutien-scolaire', 'Français', 2),
  ('cours-soutien-scolaire', 'Anglais', 3),
  ('cours-soutien-scolaire', 'Sciences (SVT, Physique-Chimie)', 4),
  ('cours-soutien-scolaire', 'Prépa BEPC', 5),
  ('cours-soutien-scolaire', 'Prépa BAC', 6),
  ('cours-soutien-scolaire', 'Prépa concours grandes écoles', 7),
  -- Immobilier
  ('immobilier', 'Gestion locative', 1),
  ('immobilier', 'Transaction immobilière', 2),
  ('immobilier', 'Home staging', 3),
  ('immobilier', 'Estimation immobilière', 4);
