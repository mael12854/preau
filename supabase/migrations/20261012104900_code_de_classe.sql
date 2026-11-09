-- Comptes donnés par l'établissement : code de classe en plus de l'identifiant et du mot de passe (ex. Duolingo, Tinkercad).
alter table public.student_app_logins add column if not exists class_code text check (class_code is null or char_length(class_code) <= 80);
-- Tinkercad rangeait son code de classe dans la case du mot de passe.
update public.student_app_logins set class_code = password, password = null where app_key = 'tinkercad' and class_code is null and password is not null;

create or replace function public.set_student_app_account(p_student uuid, p_app text, p_login text, p_password text, p_class_code text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if private.me() is null or not (private.teaches_student(p_student)
     or (private.is_admin_staff() and private.can_see_student(p_student))) then
    raise exception 'Élève introuvable' using errcode = '42501';
  end if;
  if coalesce(trim(p_app), '') = '' then raise exception 'Choisissez une appli.'; end if;
  insert into public.student_app_logins (student_id, app_key, login, password, class_code, set_by)
  values (p_student, left(trim(p_app), 40), left(trim(coalesce(p_login, '')), 120),
          left(nullif(coalesce(p_password, ''), ''), 120), left(nullif(trim(coalesce(p_class_code, '')), ''), 80), private.me())
  on conflict (student_id, app_key) do update
    set login = excluded.login, password = excluded.password, class_code = excluded.class_code,
        set_by = excluded.set_by, updated_at = now();
end $$;
revoke execute on function public.set_student_app_account(uuid, text, text, text, text) from public, anon;
grant execute on function public.set_student_app_account(uuid, text, text, text, text) to authenticated;
