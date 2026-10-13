-- Tendance quotidienne des commandes sur les 30 derniers jours.
create or replace function public.admin_daily_orders(days int default 30)
returns table (day date, orders_count bigint, amount_minor bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (created_at at time zone 'Africa/Abidjan')::date as day,
    count(*)::bigint,
    coalesce(sum(amount_minor), 0)::bigint
  from public.orders
  where
    created_at >= now() - (days || ' days')::interval
    and status in ('funded', 'in_progress', 'delivered', 'completed', 'disputed')
  group by 1
  order by 1;
$$;

revoke execute on function public.admin_daily_orders(int) from public, anon, authenticated;
grant execute on function public.admin_daily_orders(int) to service_role;

-- Répartition géographique des comptes.
create or replace function public.admin_country_breakdown()
returns table (country_code text, total bigint, providers bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    country_code,
    count(*)::bigint as total,
    count(*) filter (where role in ('provider', 'both'))::bigint as providers
  from public.profiles
  group by country_code
  order by total desc
  limit 10;
$$;

revoke execute on function public.admin_country_breakdown() from public, anon, authenticated;
grant execute on function public.admin_country_breakdown() to service_role;
