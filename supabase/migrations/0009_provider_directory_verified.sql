-- Expose la colonne verification_status dans la vue publique des prestataires.
-- Seul « verified » a de la valeur pour un visiteur ; les autres états restent opaques.
create or replace view public.provider_directory as
  select
    p.id,
    p.display_name,
    p.country_code,
    case
      when p.verification_status = 'verified' then 'verified'
      else 'unverified'
    end as verification_status
  from public.profiles p
  where p.role in ('provider', 'both');

grant select on public.provider_directory to anon, authenticated;
