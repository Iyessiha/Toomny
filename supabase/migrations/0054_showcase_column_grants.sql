-- Les visiteurs lisent seulement certaines colonnes de provider_profiles (jamais le plan).
-- Le statut et le nom d'entreprise sont publics, donc on les ouvre explicitement.
grant select (business_type, company_name) on public.provider_profiles to anon, authenticated;
