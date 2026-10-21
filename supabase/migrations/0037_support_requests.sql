-- Demandes de contact adressées à l'équipe Toomny depuis le tableau de bord.
-- Un utilisateur ne voit que ses propres demandes ; l'équipe les lit avec la clé de service.

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 120),
  body text not null check (char_length(body) between 1 and 3000),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists support_requests_status_idx on public.support_requests (status, created_at desc);

alter table public.support_requests enable row level security;
grant select, insert on public.support_requests to authenticated;

drop policy if exists support_insert_own on public.support_requests;
create policy support_insert_own on public.support_requests
  for insert to authenticated with check (profile_id = auth.uid());

drop policy if exists support_select_own on public.support_requests;
create policy support_select_own on public.support_requests
  for select to authenticated using (profile_id = auth.uid());
