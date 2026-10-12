-- Colonnes avatar et compétences sur le profil prestataire.
alter table public.provider_profiles
  add column if not exists avatar_url text,
  add column if not exists skills     text; -- liste de tags séparés par des virgules

-- Bucket public pour les avatars.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Seul le titulaire peut uploader sous son propre dossier.
-- Note : `CREATE POLICY IF NOT EXISTS` n'existe pas en PostgreSQL ; on passe
-- par DROP + CREATE (voir aussi 0020, qui répare les bases existantes).
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
