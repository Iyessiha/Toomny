-- Vitrine du prestataire : statut (particulier ou entreprise) et réalisations publiques
-- (vidéos, travaux, liens). Lecture publique ; écriture uniquement côté serveur.

alter table public.provider_profiles
  add column if not exists business_type text not null default 'individual'
    check (business_type in ('individual', 'company')),
  add column if not exists company_name text
    check (company_name is null or char_length(company_name) between 1 and 120);

create table if not exists public.portfolio_items (
  id          uuid        primary key default gen_random_uuid(),
  provider_id uuid        not null references public.profiles(id) on delete cascade,
  kind        text        not null default 'link' check (kind in ('video', 'work', 'link')),
  title       text        not null check (char_length(title) between 1 and 80),
  description text        check (char_length(description) <= 300),
  url         text        not null check (url ~* '^https://[^\s]{4,500}$'),
  created_at  timestamptz not null default now()
);

create index if not exists portfolio_items_provider_idx on public.portfolio_items (provider_id, created_at);

alter table public.portfolio_items enable row level security;

create policy portfolio_public_read on public.portfolio_items for select using (true);

revoke all on public.portfolio_items from anon, authenticated;
grant select on public.portfolio_items to anon, authenticated;
