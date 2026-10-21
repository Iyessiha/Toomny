-- Une commande ne peut être versée qu'une fois tant que le versement n'a pas échoué.
-- Deux demandes simultanées (double clic, deux onglets) ne doivent pas créer deux versements.
-- Les versements « failed » restent sans contrainte : le prestataire peut les redemander.
create unique index if not exists payouts_order_une_seule_demande
  on public.payouts (order_id)
  where status in ('queued', 'processing', 'paid');
