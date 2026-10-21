-- Migration 0032 : identifiants des pixels publicitaires, gérés depuis l'admin.
--
-- Une seule ligne (id = 1) : c'est la configuration du site entier.
-- Les identifiants sont publics (ils figurent dans le code source de chaque
-- page), donc la lecture est ouverte. L'écriture passe uniquement par le
-- client à clé de service, après requireAdmin() dans l'action serveur : aucune
-- policy d'écriture n'est créée ici.

create table if not exists public.pixels_publicitaires (
  id                 smallint primary key default 1 check (id = 1),
  meta_pixel_id      text check (meta_pixel_id is null or meta_pixel_id ~ '^[0-9]{8,20}$'),
  tiktok_pixel_id    text check (tiktok_pixel_id is null or tiktok_pixel_id ~ '^[A-Z0-9]{20,40}$'),
  google_ads_id      text check (google_ads_id is null or google_ads_id ~ '^AW-[0-9]{6,15}$'),
  ga4_measurement_id text check (ga4_measurement_id is null or ga4_measurement_id ~ '^G-[A-Z0-9]{4,15}$'),
  snapchat_pixel_id  text check (snapchat_pixel_id is null or snapchat_pixel_id ~ '^[a-f0-9-]{36}$'),
  pinterest_tag_id   text check (pinterest_tag_id is null or pinterest_tag_id ~ '^[0-9]{13,16}$'),
  updated_by         uuid,
  updated_at         timestamptz not null default now()
);

alter table public.pixels_publicitaires enable row level security;

drop policy if exists "pixels_public_read" on public.pixels_publicitaires;
create policy "pixels_public_read" on public.pixels_publicitaires
  for select using (true);

-- Reprise de l'identifiant Google Ads déjà codé en dur dans root-layout.tsx,
-- pour que le suivi ne s'interrompe pas au moment du déploiement.
insert into public.pixels_publicitaires (id, google_ads_id)
values (1, 'AW-536531182')
on conflict (id) do nothing;
