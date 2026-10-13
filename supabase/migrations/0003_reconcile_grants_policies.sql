-- ---------------------------------------------------------------------------
-- 0003 — Réconciliation des droits et des politiques.
--
-- Supersède les sections « droits » et « politiques » de 0001, dont une partie
-- n'avait pas été appliquée telle quelle en base. Cette migration décrit l'état
-- voulu : à rejouer sur un projet neuf, et à comparer sur un projet existant.
--
-- Principes :
--  - anon et authenticated n'ont AUCUN droit de table par défaut. La RLS filtre
--    les lignes, mais elle ne protège pas contre TRUNCATE : d'où le retrait global.
--  - Chaque droit accordé ci-dessous correspond à une lecture ou à une écriture
--    faite par l'application, et chacune est encadrée par une politique RLS.
--  - La clé service (serveur) n'est pas concernée : elle contourne la RLS.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

-- Catalogue et annuaire publics (lecture seule, filtrée par la RLS).
grant select on public.categories, public.services, public.reviews,
  public.provider_directory, public.fx_rates to anon, authenticated;

-- Profils : chacun lit sa fiche complète ; seules quelques colonnes sont modifiables.
grant select on public.profiles to authenticated;
grant update (display_name, first_name, last_name, phone, city, preferred_locale, preferred_currency)
  on public.profiles to authenticated;

-- Fiches prestataires : lecture publique des champs de vitrine uniquement (pas le
-- numéro de versement) ; écriture par le propriétaire, sur les mêmes champs.
grant select (id, profile_id, headline, bio, content_locale, city, rating_avg, rating_count,
  completed_orders, created_at) on public.provider_profiles to anon, authenticated;
grant insert (profile_id, headline, bio, city, content_locale),
  update (headline, bio, city, content_locale) on public.provider_profiles to authenticated;

-- Prestations : le prestataire crée (brouillon) et modifie les siennes ; la publication
-- relève de la modération (clé service).
grant insert, update on public.services to authenticated;
grant insert on public.reviews to authenticated;

-- Commandes, séquestre, versements, journal, litiges, KYC : lecture par les seules
-- parties concernées. Les écritures sur commandes et séquestre passent par le serveur.
grant select on public.orders, public.disputes, public.escrow_holds, public.payouts,
  public.ledger_entries to authenticated;
grant select, insert on public.messages, public.verifications to authenticated;

-- Politiques de prestations : lecture de ses propres prestations, création en brouillon
-- par un prestataire, modification sans passage à « active ».
drop policy if exists services_owner_write on public.services;
drop policy if exists services_owner_read on public.services;
create policy services_owner_read on public.services
  for select to authenticated using (provider_id = auth.uid());
drop policy if exists services_owner_insert on public.services;
create policy services_owner_insert on public.services
  for insert to authenticated with check (
    provider_id = auth.uid() and status = 'draft'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('provider', 'both'))
  );
drop policy if exists services_owner_update on public.services;
create policy services_owner_update on public.services
  for update to authenticated
  using (provider_id = auth.uid())
  with check (
    provider_id = auth.uid() and status <> 'active'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('provider', 'both'))
  );

-- Pas de lecture publique de la table profiles : l'annuaire passe par la vue ci-dessous,
-- qui n'expose ni téléphone ni e-mail.
drop policy if exists profiles_public_read_providers on public.profiles;

create or replace view public.provider_directory as
  select id, display_name, country_code from public.profiles where role in ('provider', 'both');
grant select on public.provider_directory to anon, authenticated;

-- Totaux d'administration : clé service uniquement.
revoke execute on function public.admin_money_totals() from public, anon, authenticated;
grant execute on function public.admin_money_totals() to service_role;
