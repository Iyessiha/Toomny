-- Migration : table boosts (service de visibilité payante)
-- À appliquer via : supabase db push ou Supabase SQL Editor

CREATE TYPE boost_tier   AS ENUM ('starter', 'pro', 'elite');
CREATE TYPE boost_status AS ENUM ('pending', 'active', 'expired', 'failed');

CREATE TABLE boosts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier                boost_tier  NOT NULL,
  status              boost_status NOT NULL DEFAULT 'pending',
  amount_minor        bigint      NOT NULL,
  currency            text        NOT NULL DEFAULT 'XOF',
  partner             text        NOT NULL DEFAULT 'geniuspay',
  partner_payment_ref text        UNIQUE,
  period_start        timestamptz,
  period_end          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX boosts_provider_id_idx      ON boosts(provider_id);
CREATE INDEX boosts_status_period_end_idx ON boosts(status, period_end);
CREATE INDEX boosts_active_tier_idx      ON boosts(tier, period_end) WHERE status = 'active';

-- RLS : un prestataire voit ses propres boosts
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boosts_owner_select"
  ON boosts FOR SELECT
  USING (provider_id = auth.uid());

-- Les insertions/updates viennent du service_role (routes API + webhook)
