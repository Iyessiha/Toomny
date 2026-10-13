-- Migration 0031 : lecture publique des profils prestataires
--
-- Problème : provider_directory est une vue sur public.profiles,
-- mais la RLS bloque `anon` (revoke all) et restreint `authenticated`
-- à sa propre ligne (profiles_select_own). La vue retourne donc toujours
-- vide pour les visiteurs non-connectés et les utilisateurs cherchant
-- un autre profil.
--
-- Fix : accorder SELECT sur les 4 colonnes safe (pas de phone, email,
-- password_hash, payout_msisdn) et créer une policy qui autorise la
-- lecture publique uniquement des comptes de type prestataire.

-- 1. Grant colonne par colonne sur profiles pour anon
--    (seulement les champs que provider_directory expose déjà)
GRANT SELECT (id, display_name, country_code, verification_status, role)
  ON public.profiles TO anon;

-- 2. Policy publique : visible si le compte est prestataire
--    Fonctionne en OU avec profiles_select_own (déjà existante).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_provider_public_read'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY profiles_provider_public_read
        ON public.profiles
        FOR SELECT
        TO anon, authenticated
        USING (
          role IN ('provider', 'both')
          OR EXISTS (
            SELECT 1 FROM public.provider_profiles pp
            WHERE pp.profile_id = id
          )
        )
    $pol$;
  END IF;
END $$;

-- 3. Remettre la vue à jour pour être explicite sur les colonnes exposées
--    (idempotent — même définition que 0026, mais documentée ici)
CREATE OR REPLACE VIEW public.provider_directory AS
  SELECT
    p.id,
    p.display_name,
    p.country_code,
    CASE
      WHEN p.verification_status = 'verified' THEN 'verified'
      ELSE 'unverified'
    END AS verification_status
  FROM public.profiles p
  WHERE p.role IN ('provider', 'both')
     OR EXISTS (
       SELECT 1 FROM public.provider_profiles pp WHERE pp.profile_id = p.id
     );

GRANT SELECT ON public.provider_directory TO anon, authenticated;
