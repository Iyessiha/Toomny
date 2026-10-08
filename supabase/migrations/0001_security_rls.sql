-- ---------------------------------------------------------------------------
-- Toomny — politiques d'accès (RLS), verrous de colonnes et journal immuable.
--
-- À appliquer APRÈS `npm run db:push`, sur un projet Supabase de test d'abord.
-- Principe : les rôles `anon` et `authenticated` ne voient que leurs propres
-- lignes ou ce qui est public. Toute écriture sensible (statut KYC, commande,
-- séquestre, versement) passe par la clé service, côté serveur, après contrôle.
-- ---------------------------------------------------------------------------

-- 1. Profil créé à l'inscription. Le rôle ne peut être que client ou prestataire :
--    une métadonnée forgée par le navigateur ne peut pas produire un admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  country text := upper(coalesce(meta->>'country_code', ''));
begin
  insert into public.profiles (
    id, email, display_name, first_name, last_name, phone, city, country_code, role
  )
  values (
    new.id,
    new.email,
    left(meta->>'display_name', 120),
    left(meta->>'first_name', 60),
    left(meta->>'last_name', 60),
    left(meta->>'phone', 30),
    left(meta->>'city', 80),
    case when country ~ '^[A-Z]{2}$' then country else 'CI' end,
    case when meta->>'role' = 'provider' then 'provider'::user_role else 'client'::user_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Profils : chacun ne lit et ne modifie que le sien. Le statut KYC et le rôle
--    ne sont PAS modifiables par l'utilisateur (verrou de colonnes).
alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, first_name, last_name, phone, city, preferred_locale, preferred_currency)
  on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Annuaire public des prestataires : seules colonnes non sensibles, sans téléphone ni e-mail.
create or replace view public.provider_directory as
  select id, display_name, country_code
  from public.profiles
  where role in ('provider', 'both');
grant select on public.provider_directory to anon, authenticated;

-- 3. Profils prestataires : lecture publique des colonnes de vitrine uniquement.
--    Le numéro mobile money (payout_msisdn) reste invisible du navigateur.
alter table public.provider_profiles enable row level security;
revoke all on public.provider_profiles from anon, authenticated;
grant select (id, profile_id, headline, bio, content_locale, city, rating_avg, rating_count, completed_orders, created_at)
  on public.provider_profiles to anon, authenticated;
create policy provider_profiles_public_read on public.provider_profiles
  for select to anon, authenticated using (true);

-- 4. Vérifications KYC : chacun voit et dépose les siennes. Aucune modification
--    par l'utilisateur ; la décision appartient à l'admin (clé service).
alter table public.verifications enable row level security;
revoke all on public.verifications from anon, authenticated;
grant select, insert on public.verifications to authenticated;
create policy verifications_select_own on public.verifications
  for select to authenticated using (profile_id = auth.uid());
create policy verifications_insert_own on public.verifications
  for insert to authenticated with check (profile_id = auth.uid());

-- 5. Catalogue : catégories actives et prestations publiées sont publiques.
--    Un prestataire gère les siennes, quel que soit leur statut.
alter table public.categories enable row level security;
revoke all on public.categories from anon, authenticated;
grant select on public.categories to anon, authenticated;
create policy categories_public_read on public.categories
  for select to anon, authenticated using (is_active);

alter table public.services enable row level security;
revoke all on public.services from anon, authenticated;
grant select, insert, update on public.services to authenticated;
create policy services_public_read on public.services
  for select to anon, authenticated using (status = 'active');
create policy services_owner_read on public.services
  for select to authenticated using (provider_id = auth.uid());
create policy services_owner_insert on public.services
  for insert to authenticated with check (provider_id = auth.uid());
create policy services_owner_update on public.services
  for update to authenticated using (provider_id = auth.uid()) with check (provider_id = auth.uid());

-- 6. Commandes, séquestre, versements, messages, litiges : visibles des seules
--    parties concernées. Aucune écriture côté navigateur : tout passe par le serveur.
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
create policy orders_participants_read on public.orders
  for select to authenticated using (client_id = auth.uid() or provider_id = auth.uid());

alter table public.escrow_holds enable row level security;
revoke all on public.escrow_holds from anon, authenticated;
grant select on public.escrow_holds to authenticated;
create policy escrow_participants_read on public.escrow_holds
  for select to authenticated using (
    exists (select 1 from public.orders o
            where o.id = order_id and (o.client_id = auth.uid() or o.provider_id = auth.uid()))
  );

alter table public.payouts enable row level security;
revoke all on public.payouts from anon, authenticated;
grant select on public.payouts to authenticated;
create policy payouts_owner_read on public.payouts
  for select to authenticated using (provider_id = auth.uid());

alter table public.messages enable row level security;
revoke all on public.messages from anon, authenticated;
grant select, insert on public.messages to authenticated;
create policy messages_participants_read on public.messages
  for select to authenticated using (
    exists (select 1 from public.orders o
            where o.id = order_id and (o.client_id = auth.uid() or o.provider_id = auth.uid()))
  );
create policy messages_participants_insert on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid() and exists (
      select 1 from public.orders o
      where o.id = order_id and (o.client_id = auth.uid() or o.provider_id = auth.uid()))
  );

alter table public.disputes enable row level security;
revoke all on public.disputes from anon, authenticated;
grant select on public.disputes to authenticated;
create policy disputes_participants_read on public.disputes
  for select to authenticated using (
    exists (select 1 from public.orders o
            where o.id = order_id and (o.client_id = auth.uid() or o.provider_id = auth.uid()))
  );

alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;
create policy reviews_public_read on public.reviews
  for select to anon, authenticated using (true);

alter table public.fx_rates enable row level security;
revoke all on public.fx_rates from anon, authenticated;
grant select on public.fx_rates to anon, authenticated;
create policy fx_rates_public_read on public.fx_rates
  for select to anon, authenticated using (true);

-- 7. Journal comptable : lecture de ses propres écritures, et immuabilité imposée
--    par la base elle-même (y compris pour la clé service).
alter table public.ledger_entries enable row level security;
revoke all on public.ledger_entries from anon, authenticated;
grant select on public.ledger_entries to authenticated;
create policy ledger_owner_read on public.ledger_entries
  for select to authenticated using (profile_id = auth.uid());

create or replace function public.forbid_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'ledger_entries est en ajout seul : corriger par une écriture inverse';
end;
$$;

drop trigger if exists ledger_entries_no_update_delete on public.ledger_entries;
create trigger ledger_entries_no_update_delete
  before update or delete on public.ledger_entries
  for each row execute function public.forbid_ledger_mutation();

drop trigger if exists ledger_entries_no_truncate on public.ledger_entries;
create trigger ledger_entries_no_truncate
  before truncate on public.ledger_entries
  for each statement execute function public.forbid_ledger_mutation();

-- 8. Stockage KYC : bucket privé. Chacun n'accède qu'à son dossier (préfixe = son id).
insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do update set public = false;

create policy kyc_objects_insert_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy kyc_objects_select_own on storage.objects
  for select to authenticated using (
    bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
