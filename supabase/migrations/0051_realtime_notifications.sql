-- Alertes en direct : le tableau de bord reçoit chaque nouvelle notification du lecteur
-- (son, bandeau, badges). Realtime respecte la RLS : chacun ne reçoit que ses propres lignes
-- (politique notifications_select_own).
alter publication supabase_realtime add table public.notifications;
