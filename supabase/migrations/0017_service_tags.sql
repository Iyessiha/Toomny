-- Tags/mots-clés sur les prestations.
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
