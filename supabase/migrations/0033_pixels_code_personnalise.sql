-- Migration 0033 : code personnalisé (JavaScript) pour les pixels, géré depuis l'admin.
-- Longueur limitée à 20 000 caractères. Seule l'action serveur admin écrit dans cette colonne.
alter table public.pixels_publicitaires
  add column if not exists custom_code text
  check (custom_code is null or char_length(custom_code) <= 20000);
