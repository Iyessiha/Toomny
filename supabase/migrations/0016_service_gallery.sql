-- Galerie d'images supplémentaires par prestation (max 4 recommandé, sans contrainte DB)
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}';
