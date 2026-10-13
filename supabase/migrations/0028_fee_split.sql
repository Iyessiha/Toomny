-- Migration 0028 : répartition des frais GeniusPay entre client et prestataire
--
-- Nouveau modèle économique :
--   • CLIENT     paie : prix du service + frais GeniusPay collect (2,5 % + 100 XOF)
--   • PRESTATAIRE supporte : commission Toomny + frais GeniusPay payout (~1 %)
--
-- Trois colonnes ajoutées à la table orders :
--   collect_fee_minor   — frais GeniusPay collect (charge client)
--   client_charge_minor — total facturé au client = amount_minor + collect_fee_minor
--   payout_fee_minor    — frais GeniusPay payout (charge prestataire)

-- ─── 1. Ajout des colonnes ────────────────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS collect_fee_minor   bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_charge_minor bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payout_fee_minor    bigint NOT NULL DEFAULT 0;

-- ─── 2. Backfill des commandes existantes ────────────────────────────────────
-- Pour les commandes déjà créées, on recalcule les frais de manière conservative :
--   • collect_fee_minor  = floor(amount_minor * 250 / 10000) + 100  (2,5 % + 100 XOF Wave)
--   • client_charge_minor = amount_minor + collect_fee_minor
--   • payout_fee_minor   = floor((amount_minor - commission_minor) * 100 / 10000) (1 %)
-- Les commandes terminées ne seront pas rechargeées ; c'est uniquement pour la
-- cohérence des données historiques.

UPDATE orders SET
  collect_fee_minor   = (amount_minor * 250 / 10000) + 100,
  client_charge_minor = amount_minor + (amount_minor * 250 / 10000) + 100,
  payout_fee_minor    = (amount_minor - commission_minor) * 100 / 10000
WHERE collect_fee_minor = 0;

-- ─── 3. Contrainte : client_charge >= amount_minor ───────────────────────────

ALTER TABLE orders
  ADD CONSTRAINT orders_client_charge_gte_amount
    CHECK (client_charge_minor >= amount_minor);
