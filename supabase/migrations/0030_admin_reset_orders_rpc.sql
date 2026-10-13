-- Migration 0030 : fonction admin_reset_orders()
--
-- Permet à l'admin de vider toutes les données transactionnelles de test
-- depuis le dashboard, sans passer par le SQL Editor Supabase.
--
-- SECURITY DEFINER : s'exécute avec les droits du propriétaire (postgres),
-- ce qui permet de désactiver temporairement le trigger append-only du ledger.
-- N'est accessible qu'au rôle service_role (clé secrète serveur).

CREATE OR REPLACE FUNCTION public.admin_reset_orders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n_orders   int;
  n_ledger   int;
  n_escrow   int;
  n_payouts  int;
  n_messages int;
  n_disputes int;
BEGIN
  SELECT COUNT(*) INTO n_orders   FROM public.orders;
  SELECT COUNT(*) INTO n_ledger   FROM public.ledger_entries;
  SELECT COUNT(*) INTO n_escrow   FROM public.escrow_holds;
  SELECT COUNT(*) INTO n_payouts  FROM public.payouts;
  SELECT COUNT(*) INTO n_messages FROM public.messages
    WHERE order_id IN (SELECT id FROM public.orders);
  SELECT COUNT(*) INTO n_disputes FROM public.disputes
    WHERE order_id IN (SELECT id FROM public.orders);

  -- Dépendances des ordres
  DELETE FROM public.messages
    WHERE order_id IN (SELECT id FROM public.orders);
  DELETE FROM public.disputes
    WHERE order_id IN (SELECT id FROM public.orders);
  DELETE FROM public.escrow_holds
    WHERE order_id IN (SELECT id FROM public.orders);
  DELETE FROM public.payouts
    WHERE order_id IN (SELECT id FROM public.orders);

  -- Ledger : désactivation temporaire du trigger append-only
  ALTER TABLE public.ledger_entries DISABLE TRIGGER ALL;
  DELETE FROM public.ledger_entries
    WHERE order_id IN (SELECT id FROM public.orders);
  ALTER TABLE public.ledger_entries ENABLE TRIGGER ALL;

  -- Ordres
  DELETE FROM public.orders;

  RETURN jsonb_build_object(
    'orders',   n_orders,
    'ledger',   n_ledger,
    'escrow',   n_escrow,
    'payouts',  n_payouts,
    'messages', n_messages,
    'disputes', n_disputes
  );
END;
$$;

-- Révoquer l'accès public, réserver au service_role uniquement
REVOKE ALL ON FUNCTION public.admin_reset_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_orders() TO service_role;
