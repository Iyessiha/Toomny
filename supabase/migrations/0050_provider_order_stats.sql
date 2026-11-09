-- Statistiques publiques des prestataires : des compteurs seulement.
-- La vue s'exécute avec les droits de son propriétaire, donc elle compte les commandes
-- que la RLS masque aux visiteurs, sans jamais exposer une ligne de commande ni d'avis.
-- « Commandes reçues » = commandes payées ou plus avancées (ni en attente de paiement, ni annulées).

create or replace view public.provider_order_stats as
select
  pr.id as provider_id,
  (select count(*) from public.orders o
     where o.provider_id = pr.id and o.status not in ('pending_payment', 'cancelled')) as orders_received,
  (select count(*) from public.orders o
     where o.provider_id = pr.id and o.status = 'completed') as orders_completed,
  (select count(*) from public.reviews r where r.target_id = pr.id) as reviews_count,
  (select count(*) from public.reviews r where r.target_id = pr.id and r.rating = 5) as stars_5,
  (select count(*) from public.reviews r where r.target_id = pr.id and r.rating = 4) as stars_4,
  (select count(*) from public.reviews r where r.target_id = pr.id and r.rating = 3) as stars_3,
  (select count(*) from public.reviews r where r.target_id = pr.id and r.rating = 2) as stars_2,
  (select count(*) from public.reviews r where r.target_id = pr.id and r.rating = 1) as stars_1
from public.profiles pr
where pr.role = 'provider';

grant select on public.provider_order_stats to anon, authenticated;
