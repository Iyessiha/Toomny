-- ---------------------------------------------------------------------------
-- 0045 — Pièces jointes (captures d'écran) et citations dans la messagerie.
--
-- - support_replies : une réponse peut citer un message précédent (snapshot
--   du rôle et d'un extrait : pas de clé étrangère, la citation reste lisible
--   même si le message cité est purgé).
-- - support_attachments : images rattachées à une demande, et à une réponse
--   une fois envoyée. Accès uniquement par le serveur (clé service) ; les
--   images sont servies par URL signée, jamais publiques.
-- - Bucket privé « support-attachments » : 5 Mo max, PNG/JPEG/WebP.
-- ---------------------------------------------------------------------------

alter table public.support_replies
  add column if not exists quoted_role text check (quoted_role in ('admin', 'requester')),
  add column if not exists quoted_body text check (char_length(quoted_body) <= 300);

create table if not exists public.support_attachments (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.support_requests(id) on delete cascade,
  reply_id     uuid references public.support_replies(id) on delete cascade,
  uploader_id  uuid references public.profiles(id) on delete set null,
  storage_path text not null unique,
  mime         text not null check (mime in ('image/png', 'image/jpeg', 'image/webp')),
  bytes        integer not null check (bytes > 0 and bytes <= 5242880),
  created_at   timestamptz not null default now()
);

create index if not exists support_attachments_request_idx on public.support_attachments (request_id);
create index if not exists support_attachments_orphan_idx on public.support_attachments (created_at) where reply_id is null;

revoke all on public.support_attachments from anon, authenticated;
alter table public.support_attachments enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('support-attachments', 'support-attachments', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
