-- ---------------------------------------------------------------------------
-- 0047 — Cycle de validation des prestations refusées puis corrigées.
--
-- - services.review_notes : points à corriger, tels que notifiés au prestataire
--   lors du dernier refus. Affichés sur sa prestation en brouillon.
-- - services.review_requested_at : date à laquelle le prestataire a soumis à
--   nouveau une prestation corrigée. Sert à remonter la prestation à l'équipe.
-- ---------------------------------------------------------------------------

alter table public.services
  add column if not exists review_notes text check (char_length(review_notes) <= 2000),
  add column if not exists review_requested_at timestamptz;

create index if not exists services_review_requested_idx
  on public.services (review_requested_at)
  where status = 'draft' and review_requested_at is not null;
