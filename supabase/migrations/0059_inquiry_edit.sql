-- Modification d'un message par son expéditeur (fil de discussion des demandes).
-- Pas de politique UPDATE pour l'expéditeur : la RLS ne peut pas restreindre les
-- colonnes modifiables. On passe donc par une fonction qui ne touche que le texte.

alter table public.inquiries add column if not exists edited_at timestamptz;

create or replace function public.edit_inquiry_message(p_id uuid, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if char_length(coalesce(p_message, '')) not between 10 and 1000 then
    raise exception 'invalid_length';
  end if;
  update public.inquiries
     set message = p_message,
         edited_at = now()
   where id = p_id
     and from_id = auth.uid();
  if not found then
    raise exception 'not_allowed';
  end if;
end;
$$;

revoke all on function public.edit_inquiry_message(uuid, text) from public, anon;
grant execute on function public.edit_inquiry_message(uuid, text) to authenticated;
