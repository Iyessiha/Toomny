-- Notifications in-app : un destinataire, un type rendu en FR/EN à la lecture,
-- des paramètres JSON (expéditeur, référence…) et un lien interne.
-- Insertion réservée à la clé de service (aucune politique INSERT) : seules
-- les actions serveur et les webhooks notifient, jamais le navigateur.
CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text        NOT NULL CHECK (char_length(type) BETWEEN 3 AND 40),
  params       jsonb       NOT NULL DEFAULT '{}',
  link         text        NOT NULL CHECK (link LIKE '/%'),
  read_at      timestamptz,
  created_at   timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON public.notifications (recipient_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "notifications_mark_read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
