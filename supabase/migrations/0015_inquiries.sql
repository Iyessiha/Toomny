-- Table pour les demandes de contact avant commande (acheteur → prestataire)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid        REFERENCES public.services(id) ON DELETE SET NULL,
  message    text        NOT NULL CHECK (char_length(message) BETWEEN 10 AND 1000),
  read_at    timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inquiries_insert"
  ON public.inquiries FOR INSERT
  WITH CHECK (auth.uid() = from_id);

CREATE POLICY "inquiries_select"
  ON public.inquiries FOR SELECT
  USING (auth.uid() = from_id OR auth.uid() = to_id);

CREATE POLICY "inquiries_mark_read"
  ON public.inquiries FOR UPDATE
  USING (auth.uid() = to_id)
  WITH CHECK (auth.uid() = to_id);
