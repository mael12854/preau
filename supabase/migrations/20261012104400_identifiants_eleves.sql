-- Identifiants d'applis donnés par l'établissement à chaque élève (ex. comptes Scratch créés par le professeur).
-- Jamais de mot de passe : seulement l'identifiant.
create table if not exists public.student_app_logins (
  student_id uuid not null references public.profiles(id),
  app_key text not null check (char_length(app_key) between 1 and 40),
  login text not null check (char_length(login) <= 120), -- vide : effacé
  set_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  primary key (student_id, app_key)
);
alter table public.student_app_logins enable row level security;
create policy "identifiants : élève, famille, professeurs, administration" on public.student_app_logins for select to authenticated
  using ((select private.is_family_of(student_id)) or (select private.teaches_student(student_id))
         or ((select private.is_admin_staff()) and (select private.can_see_student(student_id))));
revoke all on public.student_app_logins from anon;
revoke insert, update on public.student_app_logins from authenticated;

-- Renseigner (ou effacer avec un identifiant vide) : professeur de l'élève ou administration.
create or replace function public.set_student_app_login(p_student uuid, p_app text, p_login text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_login text := nullif(trim(coalesce(p_login, '')), '');
begin
  if private.me() is null or not (private.teaches_student(p_student)
     or (private.is_admin_staff() and private.can_see_student(p_student))) then
    raise exception 'Élève introuvable' using errcode = '42501';
  end if;
  if coalesce(trim(p_app), '') = '' then raise exception 'Choisissez une appli.'; end if;
  if v_login is null then
    update public.student_app_logins set login = '', updated_at = now(), set_by = private.me()
     where student_id = p_student and app_key = p_app;
    return;
  end if;
  insert into public.student_app_logins (student_id, app_key, login, set_by)
  values (p_student, left(trim(p_app), 40), left(v_login, 120), private.me())
  on conflict (student_id, app_key) do update set login = excluded.login, set_by = excluded.set_by, updated_at = now();
end $$;
revoke execute on function public.set_student_app_login(uuid, text, text) from public, anon;
grant execute on function public.set_student_app_login(uuid, text, text) to authenticated;
