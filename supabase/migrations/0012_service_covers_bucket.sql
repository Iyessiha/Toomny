-- Bucket public pour les images de couverture des prestations.
-- Les images sont publiques : elles s'affichent sans token d'auth dans les cards du catalogue.
insert into storage.buckets (id, name, public)
values ('service-covers', 'service-covers', true)
on conflict (id) do update set public = true;

-- Seul le prestataire peut uploader sous son propre dossier ({user_id}/...).
create policy service_covers_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'service-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lecture publique (anon + authenticated).
create policy service_covers_read on storage.objects
  for select using (bucket_id = 'service-covers');

-- Suppression réservée au propriétaire du dossier.
create policy service_covers_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'service-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
