-- Accusés de lecture de la messagerie support prestataire ↔ admin.
-- `markThreadRead` met à jour `read_at`, mais la table n'accordait que
-- select/insert : la mise à jour échouait en silence. On autorise uniquement
-- la colonne `read_at`, et uniquement sur les messages de l'AUTRE participant.

grant update (read_at) on public.support_messages to authenticated;

drop policy if exists support_messages_mark_read on public.support_messages;
create policy support_messages_mark_read on public.support_messages
  for update to authenticated
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.support_threads t
      where t.id = thread_id
        and (
          t.provider_id = auth.uid()
          or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
        )
    )
  )
  with check (
    sender_id <> auth.uid()
  );

-- Les UPDATE (read_at) sont diffusés en temps réel pour afficher « lu » sans rechargement.
alter table public.support_messages replica identity full;
