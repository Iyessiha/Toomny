-- Les nouveaux prestataires recevaient le plan « essentiel » au lieu de « debutant »
-- (la valeur par défaut de la colonne n'était pas celle prévue par la migration 0023).
-- Aucun abonnement n'existe : les lignes « essentiel » sans date d'expiration sont
-- des valeurs par défaut, elles repassent en « debutant ». Aucun montant n'est modifié.

alter table public.provider_profiles drop constraint if exists provider_profiles_plan_check;
alter table public.provider_profiles
  add constraint provider_profiles_plan_check
  check (plan in ('debutant', 'essentiel', 'pro', 'expert'));

alter table public.provider_profiles alter column plan set default 'debutant';

update public.provider_profiles
set plan = 'debutant'
where plan = 'essentiel' and plan_expires_at is null;
