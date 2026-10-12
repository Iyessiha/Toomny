-- ---------------------------------------------------------------------------
-- 0022 — Plan d'abonnement prestataire et souscriptions mensuelles.
--
-- 1. `provider_profiles` porte le plan actif (`essentiel` par défaut, `pro`,
--    `expert`) et son échéance (`plan_expires_at`). Ces colonnes sont en
--    lecture publique (badge et commission), mais leur écriture reste réservée
--    à la clé de service (webhook GeniusPay).
-- 2. `subscriptions` trace chaque paiement mensuel auprès de GeniusPay. Le
--    prestataire ne peut que lire ses propres lignes (RLS SELECT).
-- ---------------------------------------------------------------------------

ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'essentiel'
    CHECK (plan IN ('essentiel', 'pro', 'expert')),
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

GRANT SELECT (plan, plan_expires_at) ON public.provider_profiles TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan                text        NOT NULL CHECK (plan IN ('essentiel', 'pro', 'expert')),
  amount_minor        bigint      NOT NULL CHECK (amount_minor > 0),
  currency            text        NOT NULL DEFAULT 'XOF',
  status              text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'failed', 'expired')),
  partner             text        NOT NULL DEFAULT 'geniuspay',
  partner_payment_ref text        UNIQUE,
  period_start        timestamptz,
  period_end          timestamptz,
  created_at          timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS subscriptions_provider_idx
  ON public.subscriptions (provider_id, created_at DESC);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (provider_id = auth.uid());

GRANT SELECT ON public.subscriptions TO authenticated;
