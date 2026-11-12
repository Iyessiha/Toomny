-- Système de messagerie directe prestataire ↔ admin.
-- Deux tables distinctes des messages commande pour ne pas polluer la RLS existante.

-- Enum de statut (non pg_enum, text avec CHECK suffit)
create table public.support_threads (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid not null references public.profiles(id) on delete cascade,
  subject       text not null default 'Support',
  status        text not null default 'open' check (status in ('open', 'closed')),
  last_message_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index support_threads_provider_idx on public.support_threads(provider_id);
create index support_threads_status_idx   on public.support_threads(status, last_message_at desc nulls last);

create table public.support_messages (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid not null references public.support_threads(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete restrict,
  body            text not null check (char_length(body) between 1 and 5000),
  attachment_path text,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index support_messages_thread_idx on public.support_messages(thread_id, created_at);

-- ── Trigger : met à jour last_message_at + updated_at sur le thread ──────────
create or replace function public.update_support_thread_on_message()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.support_threads
  set last_message_at = new.created_at,
      updated_at      = new.created_at
  where id = new.thread_id;
  return new;
end;
$$;

create trigger support_messages_update_thread
  after insert on public.support_messages
  for each row execute procedure public.update_support_thread_on_message();

-- ── RLS support_threads ───────────────────────────────────────────────────────
alter table public.support_threads enable row level security;
revoke all on public.support_threads from anon, authenticated;
grant select, insert on public.support_threads to authenticated;
grant update(status, updated_at) on public.support_threads to authenticated;

-- Lecture : propre thread OU admin
create policy support_threads_read on public.support_threads
  for select to authenticated
  using (
    provider_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Création : uniquement prestataire (role provider ou both)
create policy support_threads_insert on public.support_threads
  for insert to authenticated
  with check (
    provider_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('provider', 'both')
    )
  );

-- Mise à jour du statut : admin uniquement
create policy support_threads_update on public.support_threads
  for update to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ── RLS support_messages ──────────────────────────────────────────────────────
alter table public.support_messages enable row level security;
revoke all on public.support_messages from anon, authenticated;
grant select, insert on public.support_messages to authenticated;

-- Lecture : participant du thread (provider_id ou admin)
create policy support_messages_read on public.support_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.support_threads t
      where t.id = thread_id
        and (
          t.provider_id = auth.uid()
          or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
        )
    )
  );

-- Envoi : participant ET thread ouvert
create policy support_messages_insert on public.support_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.support_threads t
      where t.id = thread_id
        and t.status = 'open'
        and (
          t.provider_id = auth.uid()
          or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
        )
    )
  );

-- ── Realtime ──────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.support_messages;
