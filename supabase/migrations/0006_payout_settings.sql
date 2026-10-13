-- Le prestataire lit et modifie son canal de versement (sa propre fiche seulement, via la RLS
-- provider_profiles_self_write). Le numéro ne devient pas public : la lecture publique de
-- provider_profiles ne porte pas ces colonnes (voir 0003).
grant select (payout_channel, payout_msisdn, payout_verified_at) on public.provider_profiles to authenticated;
grant update (payout_channel, payout_msisdn) on public.provider_profiles to authenticated;
