-- Relances de paiement : 0 = aucune, 1 = relance de 24 h envoyée, 2 = dernière relance (48 h) envoyée.
alter table public.orders add column if not exists payment_reminder_count smallint not null default 0;

-- Les commandes déjà relancées (un seul rappel, dans l'application) passent à 1 :
-- elles ne reçoivent pas la première relance e-mail une seconde fois.
update public.orders set payment_reminder_count = 1 where payment_reminded_at is not null;
