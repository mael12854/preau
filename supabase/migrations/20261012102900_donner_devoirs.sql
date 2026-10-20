-- Devoirs : l'enseignant donne un devoir (ou annonce un contrôle) à une classe qu'il a en cours.
-- Il enseigne la matière dans la classe (cours à l'emploi du temps, enseignement, ou titulaire en primaire).

create or replace function private.gives_subject(p_teacher uuid, p_class uuid, p_subject text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.teachings t where t.class_id = p_class and t.subject_id = p_subject and t.teacher_id = p_teacher)
      or exists (select 1 from public.lessons l where l.class_id = p_class and l.subject_id = p_subject and l.teacher_id = p_teacher)
      or exists (select 1 from public.classes c where c.id = p_class and c.level = 'primaire' and c.teacher_id = p_teacher)
$$;

create or replace function public.give_homework(
  p_class uuid, p_subject text, p_content text, p_due date, p_is_exam boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_me uuid := private.me(); v_id uuid; v_today date := (now() at time zone 'Europe/Paris')::date;
begin
  if v_me is null or private.my_kind() <> 'prof' then
    raise exception 'Seul un enseignant donne des devoirs.' using errcode = '42501';
  end if;
  if not private.gives_subject(v_me, p_class, p_subject) then
    raise exception 'Vous n''enseignez pas cette matière dans cette classe.' using errcode = '42501';
  end if;
  if coalesce(trim(p_content), '') = '' or length(p_content) > 2000 then
    raise exception 'Décrivez le travail (2 000 caractères au plus).';
  end if;
  if p_due is null or p_due < v_today then raise exception 'Choisissez une date à venir.'; end if;
  if p_due > v_today + 200 then raise exception 'La date est trop lointaine.'; end if;
  insert into public.homework (class_id, subject_id, teacher_id, content, given_on, due_on, is_exam)
  values (p_class, p_subject, v_me, trim(p_content), v_today, p_due, coalesce(p_is_exam, false))
  returning id into v_id;
  return v_id;
end $$;

-- Modifier un devoir qu'on a donné.
create or replace function public.update_homework(p_id uuid, p_content text, p_due date, p_is_exam boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_today date := (now() at time zone 'Europe/Paris')::date;
begin
  if not exists (select 1 from public.homework where id = p_id and teacher_id = private.me()) then
    raise exception 'Devoir introuvable' using errcode = '42501';
  end if;
  if coalesce(trim(p_content), '') = '' or length(p_content) > 2000 then
    raise exception 'Décrivez le travail (2 000 caractères au plus).';
  end if;
  if p_due is null or p_due < v_today then raise exception 'Choisissez une date à venir.'; end if;
  update public.homework set content = trim(p_content), due_on = p_due, is_exam = coalesce(p_is_exam, false) where id = p_id;
end $$;

revoke all on function private.gives_subject(uuid, uuid, text) from public, anon;
revoke all on function public.give_homework(uuid, text, text, date, boolean) from public, anon;
revoke all on function public.update_homework(uuid, text, date, boolean) from public, anon;
grant execute on function private.gives_subject(uuid, uuid, text) to authenticated;
grant execute on function public.give_homework(uuid, text, text, date, boolean) to authenticated;
grant execute on function public.update_homework(uuid, text, date, boolean) to authenticated;
