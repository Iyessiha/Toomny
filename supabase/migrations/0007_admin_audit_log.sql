-- ---------------------------------------------------------------------------
-- Journal d'administration : qui a décidé quoi, et quand.
--
-- Ajout seul, comme le journal comptable : aucune modification ni suppression,
-- y compris pour la clé service. Écrit uniquement par le serveur, après
-- `requireAdmin()`. Pas de clé étrangère vers profiles : le journal doit
-- survivre à la suppression du compte de l'administrateur.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  action text not null check (char_length(action) between 1 and 64),
  target_type text not null check (char_length(target_type) between 1 and 32),
  target_id text not null check (char_length(target_id) between 1 and 64),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from anon, authenticated;
-- Aucune politique : seule la clé service lit et écrit, depuis le serveur.

create or replace function public.forbid_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'admin_audit_log est en ajout seul';
end;
$$;

drop trigger if exists admin_audit_log_no_update_delete on public.admin_audit_log;
create trigger admin_audit_log_no_update_delete
  before update or delete on public.admin_audit_log
  for each row execute function public.forbid_audit_mutation();

drop trigger if exists admin_audit_log_no_truncate on public.admin_audit_log;
create trigger admin_audit_log_no_truncate
  before truncate on public.admin_audit_log
  for each statement execute function public.forbid_audit_mutation();
