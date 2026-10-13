-- Migration 0029 : suppression du prestataire démo et de ses données de seed
--
-- Le catalogue était peuplé d'un prestataire système fictif
-- (UUID 11111111-1111-1111-1111-111111111111) pour les aperçus de développement.
-- Cette migration le retire proprement avant le lancement en production.
--
-- Ordre : dépendances des ordres → ordres → services → profil (cascade).
-- Idempotente : ne fait rien si le compte démo n'existe plus.

DO $$
DECLARE
  demo_id uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = demo_id) THEN
    RAISE NOTICE 'Compte démo absent — rien à supprimer.';
    RETURN;
  END IF;

  -- 1. Dépendances des ordres (FK restrictives)
  DELETE FROM public.messages
  WHERE order_id IN (SELECT id FROM public.orders WHERE provider_id = demo_id);

  DELETE FROM public.disputes
  WHERE order_id IN (SELECT id FROM public.orders WHERE provider_id = demo_id);

  DELETE FROM public.escrow_holds
  WHERE order_id IN (SELECT id FROM public.orders WHERE provider_id = demo_id);

  DELETE FROM public.ledger_entries
  WHERE order_id IN (SELECT id FROM public.orders WHERE provider_id = demo_id);

  DELETE FROM public.payouts
  WHERE order_id IN (SELECT id FROM public.orders WHERE provider_id = demo_id);

  -- 2. Ordres
  DELETE FROM public.orders WHERE provider_id = demo_id;

  -- 3. Services (nécessaire avant le profil : FK restrict sur orders.service_id)
  DELETE FROM public.services WHERE provider_id = demo_id;

  -- 4. Profil (cascade → provider_profiles, verifications)
  DELETE FROM public.profiles WHERE id = demo_id;

  RAISE NOTICE 'Compte démo et données associées supprimés.';
END $$;
