-- Compteur de tentatives (connexion, inscription), partagé entre instances serverless.
-- Accessible uniquement via la fonction ci-dessous, réservée à la clé service.
create table if not exists public.auth_rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);
alter table public.auth_rate_limits enable row level security;

create or replace function public.consume_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits integer;
begin
  insert into public.auth_rate_limits (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when public.auth_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
                        then now() else public.auth_rate_limits.window_start end,
    hits = case when public.auth_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
                then 1 else public.auth_rate_limits.hits + 1 end
  returning hits into v_hits;
  return v_hits <= p_max;
end;
$$;

revoke execute on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
