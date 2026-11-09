-- ---------------------------------------------------------------------------
-- 0044 — Conversations de support à deux sens (admin ↔ prestataire/client).
--
-- - support_requests.awaiting_admin : vrai quand le dernier message vient du
--   demandeur. Alimente le badge du tableau de bord admin.
-- - support_requests.requester_seen_at : dernière ouverture de la conversation
--   par le demandeur. Sert à n'envoyer un e-mail que pour une « rafale » de
--   messages non lus, afin de limiter la consommation du quota d'envoi.
-- - support_replies.author_role : 'admin' (équipe) ou 'requester' (demandeur).
--
-- Les écritures restent faites par le serveur (clé service) après contrôle
-- d'identité : aucun droit d'écriture accordé aux clients.
-- ---------------------------------------------------------------------------

alter table public.support_requests
  add column if not exists awaiting_admin boolean not null default true,
  add column if not exists requester_seen_at timestamptz;

alter table public.support_replies
  add column if not exists author_role text not null default 'admin'
  check (author_role in ('admin', 'requester'));

-- Existant : une demande avec une réponse de l'équipe attend le demandeur, sinon l'admin.
update public.support_requests
set awaiting_admin = (replied_at is null);

drop index if exists public.support_requests_awaiting_idx;
create index if not exists support_requests_awaiting_admin_idx
  on public.support_requests (created_at desc)
  where status = 'open' and awaiting_admin = true;
