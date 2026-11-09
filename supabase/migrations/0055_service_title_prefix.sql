-- Chaque titre de prestation commence par « Je vais ». Les titres encore en groupe nominal
-- (« Identité visuelle complète ») reçoivent la phrase. Les titres déjà rédigés à la première
-- personne (« Je crée… », « Je rédige… », « I will… ») sont laissés tels quels : leur verbe doit être
-- réécrit par le prestataire, ce qu'une conversion automatique ne peut pas faire correctement.
update public.services
set title = 'Je vais ' || lower(left(title, 1)) || substr(title, 2)
where status in ('active', 'paused', 'draft')
  and title !~* '^(je |i will )';
