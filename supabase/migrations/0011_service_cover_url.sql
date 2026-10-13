-- Colonne pour l'image de couverture d'une prestation.
-- Nullable : tant qu'elle n'est pas définie, un placeholder gradient est affiché.
alter table public.services add column if not exists cover_url text;
