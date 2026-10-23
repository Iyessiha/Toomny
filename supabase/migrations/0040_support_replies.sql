-- Réponses de l'équipe Toomny aux demandes de contact (support_requests).
-- L'écriture passe par la clé de service (action admin journalisée) ; le
-- demandeur lit uniquement les réponses de ses propres demandes.

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

alter table public.support_replies enable row level security;

grant select on public.support_replies to authenticated;

drop policy if exists support_replies_select_own on public.support_replies;
create policy support_replies_select_own on public.support_replies
  for select to authenticated
  using (
    exists (
      select 1 from public.support_requests r
      where r.id = support_replies.request_id
        and r.profile_id = auth.uid()
    )
  );

-- Demandes en attente de réponse : ouvertes et sans réponse de l'équipe.
create index if not exists support_requests_awaiting_idx
  on public.support_requests (created_at desc)
  where status = 'open' and replied_at is null;
