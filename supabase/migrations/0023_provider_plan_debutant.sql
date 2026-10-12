-- ---------------------------------------------------------------------------
-- 0023 — Débutant devient le plan de base gratuit des prestataires.
-- Les plans payants expirés ou sans échéance reviennent au plan Débutant.
-- ---------------------------------------------------------------------------

ALTER TABLE public.provider_profiles
  DROP CONSTRAINT IF EXISTS provider_profiles_plan_check;

ALTER TABLE public.provider_profiles
  ALTER COLUMN plan SET DEFAULT 'debutant';

ALTER TABLE public.provider_profiles
  ADD CONSTRAINT provider_profiles_plan_check
    CHECK (plan IN ('debutant', 'essentiel', 'pro', 'expert'));

UPDATE public.provider_profiles
  SET plan = 'debutant'
  WHERE plan_expires_at IS NULL;
