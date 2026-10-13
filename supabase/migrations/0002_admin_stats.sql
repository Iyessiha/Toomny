-- Totaux d'administration calculés côté base, au lieu de charger toutes les commandes.
-- Réservée à la clé service : l'appelant (serveur) doit avoir vérifié requireAdmin().
create or replace function public.admin_money_totals()
returns table (currency text, gmv_minor bigint, commission_minor bigint, orders_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.currency,
    coalesce(sum(o.amount_minor), 0)::bigint,
    coalesce(sum(o.commission_minor), 0)::bigint,
    count(*)::bigint
  from public.orders o
  where o.status in ('funded', 'in_progress', 'delivered', 'completed', 'disputed')
  group by o.currency;
$$;

revoke execute on function public.admin_money_totals() from public, anon, authenticated;
grant execute on function public.admin_money_totals() to service_role;
