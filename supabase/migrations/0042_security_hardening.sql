-- ---------------------------------------------------------------------------
-- 0042 — Durcissement des droits trouvés lors de la vérification de la base.
--
-- 1. admin_reset_orders() vide toutes les commandes : elle était exécutable par
--    anon et authenticated via /rest/v1/rpc. Seul le serveur (clé service) doit
--    pouvoir l'appeler, ce que fait déjà src/app/(fr)/admin/orders/actions.ts.
-- 2. Le journal admin et la présence sont réservés au serveur : aucun droit client.
-- ---------------------------------------------------------------------------

revoke execute on function public.admin_reset_orders() from public, anon, authenticated;
grant execute on function public.admin_reset_orders() to service_role;

revoke all on public.admin_audit_log from anon, authenticated;
revoke all on public.online_presence from anon, authenticated;
