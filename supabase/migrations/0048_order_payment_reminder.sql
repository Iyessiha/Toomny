-- ---------------------------------------------------------------------------
-- 0048 — Rappel de paiement des commandes restées en attente.
-- payment_reminded_at : date du rappel envoyé au client (une seule fois par commande).
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists payment_reminded_at timestamptz;

create index if not exists orders_payment_reminder_idx
  on public.orders (created_at)
  where status = 'pending_payment' and payment_reminded_at is null;
