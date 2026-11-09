-- Identifiants d'applis donnés par l'établissement : on y ajoute le mot de passe (comptes créés par le professeur,
-- ex. Scratch). Visible seulement par l'élève, sa famille, ses professeurs et l'administration (mêmes règles que l'identifiant).
alter table public.student_app_logins add column if not exists password text check (password is null or char_length(password) <= 120);

create or replace function public.set_student_app_credentials(p_student uuid, p_app text, p_login text, p_password text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_login text := nullif(trim(coalesce(p_login, '')), ''); v_pwd text := nullif(coalesce(p_password, ''), '');
begin
  if private.me() is null or not (private.teaches_student(p_student)
     or (private.is_admin_staff() and private.can_see_student(p_student))) then
    raise exception 'Élève introuvable' using errcode = '42501';
  end if;
  if coalesce(trim(p_app), '') = '' then raise exception 'Choisissez une appli.'; end if;
  insert into public.student_app_logins (student_id, app_key, login, password, set_by)
  values (p_student, left(trim(p_app), 40), coalesce(left(v_login, 120), ''), left(v_pwd, 120), private.me())
  on conflict (student_id, app_key) do update
    set login = excluded.login, password = excluded.password, set_by = excluded.set_by, updated_at = now();
end $$;
revoke execute on function public.set_student_app_credentials(uuid, text, text, text) from public, anon;
grant execute on function public.set_student_app_credentials(uuid, text, text, text) to authenticated;
