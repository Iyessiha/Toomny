-- Add provider online status tracking
-- Allows clients to see which providers are currently online

-- 1. Add online status columns to profiles table
alter table public.profiles
add column if not exists last_seen_at timestamp with time zone default now() not null,
add column if not exists is_online boolean default false not null;

-- Create indexes for efficient queries
create index if not exists profiles_is_online_idx on public.profiles(is_online) where is_online = true;
create index if not exists profiles_last_seen_idx on public.profiles(last_seen_at desc);

-- 2. Create online_presence table for detailed tracking
create table if not exists public.online_presence (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  session_id text not null,
  first_seen_at timestamp with time zone default now() not null,
  last_activity_at timestamp with time zone default now() not null,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now() not null
);

-- Create indexes for efficient queries
create index if not exists online_presence_user_idx on public.online_presence(user_id);
create index if not exists online_presence_activity_idx on public.online_presence(last_activity_at desc);
create index if not exists online_presence_session_idx on public.online_presence(session_id);

-- 3. Enable RLS on online_presence
alter table public.online_presence enable row level security;

-- Anyone can see online presence info (for the public provider list)
revoke all on public.online_presence from anon, authenticated;
grant select on public.online_presence to anon, authenticated;

create policy online_presence_public_read on public.online_presence
  for select to anon, authenticated using (true);

-- Users can see their own presence records
create policy online_presence_owner_read on public.online_presence
  for select to authenticated using (user_id = auth.uid());

-- Only the API (via RPC) can insert/update presence
-- Prevents tampering with online status

-- 4. Create RPC function to update online status
create or replace function public.update_user_presence(
  p_session_id text,
  p_ip_address text default null,
  p_user_agent text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_exists boolean;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User not authenticated';
  end if;

  -- Check if presence record exists for this user
  select exists(select 1 from public.online_presence where user_id = v_user_id)
  into v_exists;

  if v_exists then
    -- Update existing presence
    update public.online_presence
    set
      last_activity_at = now(),
      session_id = p_session_id,
      ip_address = p_ip_address,
      user_agent = p_user_agent
    where user_id = v_user_id;
  else
    -- Create new presence record
    insert into public.online_presence (user_id, session_id, ip_address, user_agent)
    values (v_user_id, p_session_id, p_ip_address, p_user_agent);
  end if;

  -- Update profile's last_seen_at and is_online status
  update public.profiles
  set
    last_seen_at = now(),
    is_online = true
  where id = v_user_id;
end;
$$;

-- 5. Create RPC function to mark user as offline
create or replace function public.mark_user_offline()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User not authenticated';
  end if;

  -- Delete presence record
  delete from public.online_presence where user_id = v_user_id;

  -- Update profile's is_online status
  update public.profiles
  set is_online = false
  where id = v_user_id;
end;
$$;

-- 6. Create function to automatically mark users as offline after inactivity
create or replace function public.cleanup_inactive_presence()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inactivity_minutes integer := 15; -- Mark offline after 15 minutes of inactivity
begin
  -- Update presence records older than inactivity threshold
  update public.profiles
  set is_online = false
  where is_online = true
  and last_seen_at < now() - (v_inactivity_minutes || ' minutes')::interval;

  -- Delete old presence records
  delete from public.online_presence
  where last_activity_at < now() - (v_inactivity_minutes || ' minutes')::interval;
end;
$$;

-- 7. Create view for online providers
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
      where s.provider_id = p.id
      and s.status = 'active'
    ) as active_services_count
  from public.profiles p
  left join public.provider_profiles pp on p.id = pp.id
  where p.role in ('provider', 'both')
  and p.is_online = true;

-- Grant access to online_providers view
revoke all on public.online_providers from anon, authenticated;
grant select on public.online_providers to anon, authenticated;

-- 8. Add comment for clarity
comment on table public.online_presence is 'Tracks active sessions for users to determine online status';
comment on column public.profiles.is_online is 'Whether the user is currently online (determined by recent activity)';
comment on column public.profiles.last_seen_at is 'Timestamp of the last activity from this user';
comment on function public.update_user_presence is 'Called by client to update user presence and mark as online';
comment on function public.mark_user_offline is 'Called by client when leaving or logging out';
comment on function public.cleanup_inactive_presence is 'Server-side scheduled job to mark inactive users as offline';
comment on view public.online_providers is 'View of providers who are currently online, with their profile info';
