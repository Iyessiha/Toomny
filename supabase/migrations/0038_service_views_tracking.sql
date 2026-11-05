-- Add service views tracking
-- Allows providers to see how many times their services have been viewed

-- 1. Add views_count column to services table
alter table public.services
add column if not exists views_count integer default 0 not null;

-- 2. Create service_views table to track unique views
create table if not exists public.service_views (
  id uuid default gen_random_uuid() primary key,
  service_id uuid not null references public.services(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  viewer_ip text,
  viewed_at timestamp with time zone default now() not null,
  user_agent text,
  created_at timestamp with time zone default now() not null
);

-- Create indexes for efficient queries
create index if not exists service_views_service_idx on public.service_views(service_id);
create index if not exists service_views_viewer_idx on public.service_views(viewer_id);
create index if not exists service_views_created_idx on public.service_views(created_at desc);
create index if not exists service_views_service_created_idx on public.service_views(service_id, created_at desc);

-- 3. Enable RLS on service_views
alter table public.service_views enable row level security;

-- Viewers can see their own views
revoke all on public.service_views from anon, authenticated;
grant select on public.service_views to authenticated;

-- Providers can see views of their own services
create policy service_views_provider_read on public.service_views
  for select to authenticated using (
    exists (
      select 1 from public.services s
      where s.id = service_views.service_id
      and s.provider_id = auth.uid()
    )
  );

-- Only the API (via RPC) can insert views - prevents tampering
create or replace function public.increment_service_views(
  p_service_id uuid,
  p_viewer_ip text default null,
  p_user_agent text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
begin
  -- Check if service exists
  select exists(select 1 from public.services where id = p_service_id)
  into v_exists;

  if not v_exists then
    raise exception 'Service not found';
  end if;

  -- Insert view record
  insert into public.service_views (service_id, viewer_id, viewer_ip, user_agent)
  values (p_service_id, auth.uid(), p_viewer_ip, p_user_agent);

  -- Increment views_count
  update public.services
  set views_count = views_count + 1
  where id = p_service_id;
end;
$$;

-- 4. Create a view for service stats (including view counts)
create or replace view public.service_stats as
  select
    s.id,
    s.provider_id,
    s.views_count,
    count(distinct sv.viewer_ip) as unique_viewers_ip,
    count(distinct sv.viewer_id) as unique_logged_viewers,
    count(sv.id) as total_views,
    max(sv.viewed_at) as last_viewed_at,
    min(sv.viewed_at) as first_viewed_at
  from public.services s
  left join public.service_views sv on s.id = sv.service_id
  group by s.id, s.provider_id, s.views_count;

-- Grant access to service_stats view
revoke all on public.service_stats from anon, authenticated;
grant select on public.service_stats to authenticated;

-- Providers can see stats for their own services
create policy service_stats_provider_read on public.service_stats
  for select to authenticated using (provider_id = auth.uid());

-- Add comment for clarity
comment on table public.service_views is 'Tracks individual views of services by viewers (identified by IP or user ID)';
comment on column public.services.views_count is 'Denormalized count of total views for this service (for performance)';
comment on function public.increment_service_views is 'Called server-side to safely record a service view and increment the counter';
