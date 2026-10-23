-- ---------------------------------------------------------------------------
-- 0049 — Éviter le double paiement et journaliser les confirmations reçues.
--
-- - escrow_holds.checkout_url : adresse de paiement de la demande en cours. Un
--   clic répété réutilise la même page au lieu d'en créer une nouvelle.
-- - payment_webhook_log : chaque notification reçue du partenaire de paiement,
--   pour savoir ce qui arrive réellement. Écriture serveur uniquement.
-- ---------------------------------------------------------------------------

alter table public.escrow_holds
  add column if not exists checkout_url text;

create table if not exists public.payment_webhook_log (
  id          bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  partner     text not null,
  event       text not null,
  reference   text,
  outcome     text not null
);

create index if not exists payment_webhook_log_received_idx on public.payment_webhook_log (received_at desc);

revoke all on public.payment_webhook_log from anon, authenticated;
alter table public.payment_webhook_log enable row level security;
