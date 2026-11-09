-- ---------------------------------------------------------------------------
-- 0046 — Rétention du texte des demandes de support résolues.
--
-- Une demande clôturée depuis plus de 90 jours perd son sujet, son message et
-- ses réponses (le cron support-retention). La ligne reste, avec son statut et
-- ses dates, pour les statistiques. text_purged_at marque les lignes traitées.
-- ---------------------------------------------------------------------------

alter table public.support_requests
  add column if not exists text_purged_at timestamptz;

create index if not exists support_requests_retention_idx
  on public.support_requests (closed_at)
  where status = 'closed' and text_purged_at is null;
