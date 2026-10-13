-- Forfaits Basic / Standard / Premium par prestation.
CREATE TABLE IF NOT EXISTS public.service_packages (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id    uuid        NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  tier          smallint    NOT NULL CHECK (tier IN (1, 2, 3)),  -- 1 Basic  2 Standard  3 Premium
  name          text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  description   text        CHECK (char_length(description) <= 500),
  price_minor   bigint      NOT NULL CHECK (price_minor >= 1000),
  currency      text        NOT NULL DEFAULT 'XOF',
  delivery_days smallint    NOT NULL CHECK (delivery_days BETWEEN 1 AND 365),
  created_at    timestamptz DEFAULT now() NOT NULL,
  UNIQUE (service_id, tier)
);

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

-- Lecture publique des forfaits (prix visibles sur les fiches).
CREATE POLICY "packages_public_read" ON public.service_packages
  FOR SELECT USING (true);

-- Écriture réservée à la clé service (actions côté serveur).
-- Pas de policy INSERT/UPDATE/DELETE pour authenticated : on utilise le client admin.

-- Stocker le forfait choisi lors de la commande (nullable = pas de forfait).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.service_packages(id) ON DELETE SET NULL;
