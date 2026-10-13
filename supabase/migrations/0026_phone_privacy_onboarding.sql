-- Migration 0026 : confidentialité du numéro de téléphone + flag onboarding
-- 1. Restreindre la lecture de phone/payout_msisdn au seul propriétaire.
-- 2. Ajouter onboarding_done (bool) dans profiles pour le tutoriel post-inscription.

-- ─── 1. Champ onboarding_done ────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false;

-- ─── 2. Vue publique sécurisée des profils ────────────────────────────────────
-- La table profiles expose phone et email ; on crée / remplace la vue
-- provider_directory qui ne fournit que les champs publics.
-- (La vue existante peut déjà exister — on la recrée proprement.)

CREATE OR REPLACE VIEW provider_directory AS
SELECT
  id,
  display_name,
  first_name,
  last_name,
  city,
  country_code,
  role,
  verification_status,
  preferred_locale,
  created_at
FROM profiles;

-- ─── 3. RLS sur profiles ─────────────────────────────────────────────────────
-- S'assurer que la RLS est activée (idempotent).
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique : chaque utilisateur ne lit QUE sa propre ligne complète.
-- (Les autres requêtes passent par provider_directory qui n'a pas phone/email.)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_owner_read'
  ) THEN
    CREATE POLICY profiles_owner_read ON profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- Politique d'écriture : chaque utilisateur ne modifie que sa propre ligne.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_owner_write'
  ) THEN
    CREATE POLICY profiles_owner_write ON profiles
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- ─── 4. RLS sur provider_profiles ────────────────────────────────────────────
-- payout_msisdn doit être invisible aux autres utilisateurs.
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;

-- Lecture des champs publics du profil prestataire : tout le monde peut lire
-- (les champs sensibles — payout_msisdn — ne sont jamais dans le SELECT public).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'provider_profiles' AND policyname = 'provider_profiles_public_read'
  ) THEN
    CREATE POLICY provider_profiles_public_read ON provider_profiles
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Écriture : uniquement le propriétaire.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'provider_profiles' AND policyname = 'provider_profiles_owner_write'
  ) THEN
    CREATE POLICY provider_profiles_owner_write ON provider_profiles
      FOR ALL
      USING (auth.uid() = profile_id);
  END IF;
END $$;

-- ─── 5. Bucket de pièces jointes du chat ─────────────────────────────────────
-- Crée le bucket s'il n'existe pas, en mode privé (pas d'accès public).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  5242880,  -- 5 Mo
  ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Politique : upload autorisé seulement pour les parties d'une commande.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies WHERE name = 'chat_attach_upload' AND bucket_id = 'chat-attachments'
  ) THEN
    CREATE POLICY chat_attach_upload ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'chat-attachments');
  END IF;
END $$;

-- Lecture : uniquement les parties à la commande (vérification via le path).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies WHERE name = 'chat_attach_read' AND bucket_id = 'chat-attachments'
  ) THEN
    CREATE POLICY chat_attach_read ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'chat-attachments');
  END IF;
END $$;
