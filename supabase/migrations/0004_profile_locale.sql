-- Le profil reprend la langue choisie à l'inscription (metadata preferred_locale),
-- au lieu de la fixer à « fr ». Le rôle reste borné à client ou prestataire (voir 0001).
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  role_val public.user_role := case when meta->>'role' = 'provider' then 'provider'::public.user_role else 'client'::public.user_role end;
  locale_val public.locale := case when meta->>'preferred_locale' = 'en' then 'en'::public.locale else 'fr'::public.locale end;
begin
  insert into public.profiles (id, email, display_name, first_name, last_name, phone, city, country_code, role, preferred_locale)
  values (
    new.id, new.email,
    left(nullif(meta->>'display_name', ''), 120),
    left(nullif(meta->>'first_name', ''), 60),
    left(nullif(meta->>'last_name', ''), 60),
    left(nullif(meta->>'phone', ''), 30),
    left(nullif(meta->>'city', ''), 80),
    case when upper(coalesce(meta->>'country_code', '')) ~ '^[A-Z]{2}$' then upper(meta->>'country_code') else 'CI' end,
    role_val,
    locale_val
  )
  on conflict (id) do nothing;

  if role_val = 'provider' then
    insert into public.provider_profiles (profile_id) values (new.id) on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;
