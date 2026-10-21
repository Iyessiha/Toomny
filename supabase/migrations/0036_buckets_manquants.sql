-- Buckets absents de la base de production : photos de profil et pièces jointes du chat.
-- Sans eux, l'envoi d'une photo de profil et d'un document dans une commande échoue.
-- Idempotent : peut être exécutée même si certains éléments existent déjà.

-- ─── Photos de profil (bucket public, chaque utilisateur écrit dans son dossier) ───
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists avatars_insert on storage.objects;
create policy avatars_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_delete on storage.objects;
create policy avatars_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Pièces jointes du chat (privé, 5 Mo, images et PDF seulement) ───
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf']
)
on conflict (id) do update set
  public             = false,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lecture : seulement les deux parties de la commande (le dossier est l'identifiant de la commande).
drop policy if exists chat_attach_read on storage.objects;
create policy chat_attach_read on storage.objects
  for select to authenticated using (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.orders o
      where o.id::text = (storage.foldername(name))[1]
        and (o.client_id = auth.uid() or o.provider_id = auth.uid())
    )
  );

-- Envoi : seulement dans le dossier d'une commande dont l'utilisateur est partie.
drop policy if exists chat_attach_upload on storage.objects;
create policy chat_attach_upload on storage.objects
  for insert to authenticated with check (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.orders o
      where o.id::text = (storage.foldername(name))[1]
        and (o.client_id = auth.uid() or o.provider_id = auth.uid())
    )
  );
