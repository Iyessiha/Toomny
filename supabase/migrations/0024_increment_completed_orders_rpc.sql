-- Atomic increment for provider_profiles.completed_orders.
-- Used by order-ledger.ts to avoid a read-modify-write race when two orders
-- complete at the same time for the same provider.

create or replace function public.increment_completed_orders(provider_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update provider_profiles
  set completed_orders = coalesce(completed_orders, 0) + 1
  where profile_id = provider_id;
$$;

-- Only the service role needs to call this (server-side code uses the admin client).
revoke execute on function public.increment_completed_orders(uuid) from anon, authenticated;
