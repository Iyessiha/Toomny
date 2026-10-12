-- ---------------------------------------------------------------------------
-- 0020 — Réparation des droits et politiques manquants (0014 → 0019).
--
-- Constats :
--  1. `provider_profiles` n'a AUCUNE politique d'écriture : l'upsert du profil
--     public et la modification du canal de versement (client RLS, donc soumis
--     aux politiques) sont refusés. La policy `provider_profiles_self_write`
--     mentionnée en 0006 n'existe pas : on la crée ici.
--  2. Les colonnes vitrine ajoutées en 0014 (avatar_url, skills) et 0019
--     (spoken_languages, website_url, linkedin_url, twitter_url) n'ont aucun
--     GRANT : ni lecture publique, ni écriture propriétaire. Sans GRANT, c'est
--     un refus silencieux (données nulles) ou une erreur 403.
--  3. `inquiries` (0015) a des politiques mais aucun GRANT : les formulaires de
--     contact sont refusés.
--  4. `service_packages` (0018) a une politique de lecture publique mais aucun
--     GRANT SELECT : les forfaits sont invisibles sur les fiches.
--  5. 0014 utilisait `CREATE POLICY IF NOT EXISTS`, qui n'existe pas en
--     PostgreSQL : la migration échoue sur ces lignes. Les politiques du
--     bucket `avatars` sont (re)créées ici avec la syntaxe valide, de façon
--     idempotente — que 0014 ait été partiellement appliquée ou non.
--
-- Tout est idempotent : rejouable sans risque sur une base existante.
-- ---------------------------------------------------------------------------

-- 1. Écriture propriétaire sur la fiche prestataire --------------------------
-- Le propriétaire crée et modifie sa fiche. Les colonnes sensibles
-- (rating_avg, rating_count, completed_orders, payout_verified_at) restent
-- protégées par l'ABSENCE de grant : la politique ne suffit pas à les écrire.
drop policy if exists provider_profiles_self_insert on public.provider_profiles;
create policy provider_profiles_self_insert on public.provider_profiles
  for insert to authenticated
  with check (profile_id = auth.uid());

drop policy if exists provider_profiles_self_update on public.provider_profiles;
create policy provider_profiles_self_update on public.provider_profiles
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- 2. Grants des colonnes vitrine (0014 + 0019) --------------------------------
-- Lecture publique : ce que les visiteurs voient sur les fiches.
grant select (avatar_url, skills, spoken_languages, website_url, linkedin_url, twitter_url)
  on public.provider_profiles to anon, authenticated;

-- Écriture propriétaire : les mêmes, plus celles déjà accordées en 0003/0006.
grant insert (avatar_url, skills, spoken_languages, website_url, linkedin_url, twitter_url)
  on public.provider_profiles to authenticated;
grant update (avatar_url, skills, spoken_languages, website_url, linkedin_url, twitter_url)
  on public.provider_profiles to authenticated;

-- 3. Demandes de contact ------------------------------------------------------
grant select, insert, update on public.inquiries to authenticated;

-- 4. Forfaits : lecture publique (les écritures passent par la clé service) ---
grant select on public.service_packages to anon, authenticated;

-- 5. Bucket avatars (réparation de 0014) --------------------------------------
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
