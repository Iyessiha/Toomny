-- ---------------------------------------------------------------------------
-- 0043 — Présence en ligne opérationnelle et verrou complet du journal admin.
--
-- 1. update_user_presence / mark_user_offline : appelées par le navigateur du
--    prestataire connecté (heartbeat, déconnexion). Elles ne touchent que la
--    ligne de auth.uid() ; les autres droits sont fermés.
-- 2. La vue online_providers ne compte un prestataire en ligne que si son
--    dernier signal a moins de 15 minutes : pas besoin de cron de nettoyage.
-- 3. Le journal admin refuse aussi TRUNCATE (UPDATE et DELETE étaient déjà bloqués).
--
-- Présence : on ne supprime pas la ligne de online_presence pour « hors ligne »,
-- on la date à l'epoch : la vue filtre sur profiles.last_seen_at de toute façon.
-- ---------------------------------------------------------------------------

create or replace function public.update_user_presence(p_session_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'User not authenticated';
  end if;

  insert into public.online_presence (user_id, session_id, last_activity_at)
  values (v_user_id, left(p_session_id, 64), now())
  on conflict (user_id) do update
    set last_activity_at = now(),
        session_id = excluded.session_id;

  update public.profiles
  set last_seen_at = now(), is_online = true
  where id = v_user_id;
end;
$$;

create or replace function public.mark_user_offline()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'User not authenticated';
  end if;

  update public.online_presence
  set last_activity_at = 'epoch'::timestamptz
  where user_id = v_user_id;

  update public.profiles
  set is_online = false
  where id = v_user_id;
end;
$$;

revoke execute on function public.update_user_presence(text) from public, anon;
grant execute on function public.update_user_presence(text) to authenticated;
revoke execute on function public.mark_user_offline() from public, anon;
grant execute on function public.mark_user_offline() to authenticated;

create or replace view public.online_providers as
  select
    p.id,
    p.display_name,
    p.country_code,
    p.is_online,
    p.last_seen_at,
    pp.headline,
    pp.bio,
    pp.city,
    pp.rating_avg,
    pp.completed_orders,
    (
      select count(*)::integer
      from public.services s
      where s.provider_id = p.id and s.status = 'active'
    ) as active_services_count
  from public.profiles p
  left join public.provider_profiles pp on pp.profile_id = p.id
  where p.role in ('provider', 'both')
    and p.is_online = true
    and p.last_seen_at > now() - interval '15 minutes';

revoke all on public.online_providers from anon, authenticated;
grant select on public.online_providers to anon, authenticated;

create trigger admin_audit_log_no_truncate
  before truncate on public.admin_audit_log
  for each statement execute function public.forbid_audit_mutation();
