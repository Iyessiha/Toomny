-- Suppléments : options payantes ajoutées à une prestation, réservées aux prestataires
-- ayant un plan payant (la règle est appliquée côté serveur, à la création et à la commande).

create table if not exists public.service_addons (
  id                  uuid        primary key default gen_random_uuid(),
  service_id          uuid        not null references public.services(id) on delete cascade,
  provider_id         uuid        not null references public.profiles(id) on delete cascade,
  title               text        not null check (char_length(title) between 1 and 80),
  description         text        check (char_length(description) <= 300),
  price_minor         bigint      not null check (price_minor >= 1000),
  currency            text        not null default 'XOF',
  extra_delivery_days smallint    not null default 0 check (extra_delivery_days between 0 and 60),
  active              boolean     not null default true,
  created_at          timestamptz not null default now()
);

create index if not exists service_addons_service_idx on public.service_addons (service_id);

alter table public.service_addons enable row level security;

-- Lecture publique, uniquement pour les suppléments actifs d'une prestation publiée.
create policy addons_public_read on public.service_addons
  for select using (
    active and exists (
      select 1 from public.services s where s.id = service_id and s.status = 'active'
    )
  );

-- Écritures réservées au client admin (actions serveur), comme les forfaits.
revoke all on public.service_addons from anon, authenticated;
grant select on public.service_addons to anon, authenticated;

-- Suppléments choisis lors d'une commande : copie figée (le prix du prestataire peut changer ensuite).
create table if not exists public.order_addons (
  id                  uuid        primary key default gen_random_uuid(),
  order_id            uuid        not null references public.orders(id) on delete cascade,
  addon_id            uuid        references public.service_addons(id) on delete set null,
  title               text        not null,
  price_minor         bigint      not null,
  extra_delivery_days smallint    not null default 0,
  created_at          timestamptz not null default now()
);

create index if not exists order_addons_order_idx on public.order_addons (order_id);

alter table public.order_addons enable row level security;

-- Lecture réservée aux deux parties de la commande.
create policy order_addons_party_read on public.order_addons
  for select to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.client_id = auth.uid() or o.provider_id = auth.uid())
    )
  );

revoke all on public.order_addons from anon, authenticated;
grant select on public.order_addons to authenticated;
