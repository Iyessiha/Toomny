-- Active la publication Supabase Realtime sur messages.
-- Les INSERT sur messages seront poussés en temps réel aux abonnés autorisés (RLS appliqué).
alter publication supabase_realtime add table public.messages;
