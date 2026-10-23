-- ---------------------------------------------------------------------------
-- 0041 — Réparation du schéma en production.
--
-- La base réelle a été construite sans rejouer les migrations 0007, 0010,
-- 0014, 0019, 0020, 0021, 0024, 0026, 0039 et 0040 : des objets utilisés par
-- le code manquent (notifications, journal admin, avatars et compétences du
-- profil, présence, support). Cette migration ajoute uniquement ce qui manque,
-- reprend les définitions sources à l'identique, et corrige la jointure de la
-- vue online_providers (pp.profile_id, et non pp.id).
--
-- Entièrement idempotente : rejouable sans effet sur une base à jour.
-- Aucune donnée existante n'est modifiée ni supprimée.
-- ---------------------------------------------------------------------------

-- 1. Profil prestataire : vitrine (0014, 0019) et grants (0020) ----------------
alter table public.provider_profiles
  add column if not exists avatar_url      text,
  add column if not exists skills          text,
  add column if not exists spoken_languages text,
  add column if not exists website_url     text,
  add column if not exists linkedin_url    text,
  add column if not exists twitter_url     text;

grant select (avatar_url, skills, spoken_languages, website_url, linkedin_url, twitter_url)
  on public.provider_profiles to anon, authenticated;
grant insert (avatar_url, skills, spoken_languages, website_url, linkedin_url, twitter_url)
  on public.provider_profiles to authenticated;
grant update (avatar_url, skills, spoken_languages, website_url, linkedin_url, twitter_url)
  on public.provider_profiles to authenticated;

-- 2. Profil utilisateur : onboarding (0026) et présence (0039) ----------------
alter table public.profiles
  add column if not exists onboarding_done boolean not null default false,
  add column if not exists last_seen_at    timestamptz not null default now(),
  add column if not exists is_online       boolean not null default false;

create index if not exists profiles_is_online_idx on public.profiles (is_online) where is_online = true;
create index if not exists profiles_last_seen_idx on public.profiles (last_seen_at desc);

-- 3. Présence en ligne (0039, durcie) -----------------------------------------
-- Table réservée au serveur : ip_address et user_agent ne sont jamais lisibles
-- par les clients (la version 0039 les exposait en lecture publique).
create table if not exists public.online_presence (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid not null unique references public.profiles(id) on delete cascade,
  session_id       text not null,
  first_seen_at    timestamptz default now() not null,
  last_activity_at timestamptz default now() not null,
  ip_address       text,
  user_agent       text,
  created_at       timestamptz default now() not null
);

revoke all on public.online_presence from anon, authenticated;
alter table public.online_presence enable row level security;

-- Vue des prestataires en ligne. Jointure corrigée : provider_profiles.profile_id.
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
    and p.is_online = true;

revoke all on public.online_providers from anon, authenticated;
grant select on public.online_providers to anon, authenticated;

-- 4. Notifications in-app (0021) ----------------------------------------------
create table if not exists public.notifications (
  id           uuid        default gen_random_uuid() primary key,
  recipient_id uuid        not null references public.profiles(id) on delete cascade,
  type         text        not null check (char_length(type) between 3 and 40),
  params       jsonb       not null default '{}',
  link         text        not null check (link like '/%'),
  read_at      timestamptz,
  created_at   timestamptz default now() not null
);

create index if not exists notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

-- Les nouvelles tables reçoivent par défaut tous les droits pour anon/authenticated
-- sur Supabase : on les retire, puis on n'accorde que lecture et marquage lu.
revoke all on public.notifications from anon, authenticated;
grant select, update on public.notifications to authenticated;

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (auth.uid() = recipient_id);

drop policy if exists notifications_mark_read on public.notifications;
create policy notifications_mark_read on public.notifications
  for update to authenticated using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- 5. Journal d'administration (0007) ------------------------------------------
create table if not exists public.admin_audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid not null,
  action      text not null check (char_length(action) between 1 and 64),
  target_type text not null check (char_length(target_type) between 1 and 32),
  target_id   text not null check (char_length(target_id) between 1 and 64),
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

revoke all on public.admin_audit_log from anon, authenticated;
alter table public.admin_audit_log enable row level security;

create or replace function public.forbid_audit_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'admin_audit_log est en ajout seul';
end;
$$;

drop trigger if exists admin_audit_log_no_update_delete on public.admin_audit_log;
create trigger admin_audit_log_no_update_delete
  before update or delete on public.admin_audit_log
  for each row execute function public.forbid_audit_mutation();

drop trigger if exists admin_audit_log_no_truncate on public.admin_audit_log;
create trigger admin_audit_log_no_truncate
  before truncate on public.admin_audit_log
  for each statement execute function public.forbid_audit_mutation();

-- 6. Fonctions utilisées par le code (0010, 0024) ------------------------------
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
  where created_at >= now() - (days || ' days')::interval
    and status in ('funded', 'in_progress', 'delivered', 'completed', 'disputed')
  group by 1
  order by 1;
$$;

revoke execute on function public.admin_daily_orders(int) from public, anon, authenticated;
grant execute on function public.admin_daily_orders(int) to service_role;

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

revoke execute on function public.increment_completed_orders(uuid) from public, anon, authenticated;

-- 7. Support : réponses de l'équipe (0040) -------------------------------------
alter table public.support_requests
  add column if not exists replied_at timestamptz;

create table if not exists public.support_replies (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.support_requests(id) on delete cascade,
  author_id  uuid references public.profiles(id) on delete set null,
  body       text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now()
);

create index if not exists support_replies_request_idx on public.support_replies (request_id, created_at);

revoke all on public.support_replies from anon, authenticated;
grant select on public.support_replies to authenticated;
alter table public.support_replies enable row level security;

drop policy if exists support_replies_select_own on public.support_replies;
create policy support_replies_select_own on public.support_replies
  for select to authenticated
  using (
    exists (
      select 1 from public.support_requests r
      where r.id = support_replies.request_id and r.profile_id = auth.uid()
    )
  );

create index if not exists support_requests_awaiting_idx
  on public.support_requests (created_at desc)
  where status = 'open' and replied_at is null;
