-- Saisir une absence ou un retard après coup (jour sans appel, absences d'avant Préau), et en demander le justificatif.
create or replace function public.add_absence(
  p_student uuid, p_kind text, p_day date, p_whole_day boolean, p_from time, p_to time, p_detail text, p_request boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_detail text := nullif(trim(coalesce(p_detail, '')), '');
begin
  if private.me() is null or not (private.teaches_student(p_student) or (private.is_admin_staff() and private.can_see_student(p_student))) then
    raise exception 'Élève introuvable' using errcode = '42501';
  end if;
  if p_kind not in ('absence', 'retard') then raise exception 'Choisissez absence ou retard.'; end if;
  if p_day is null then raise exception 'Indiquez la date.'; end if;
  if p_day > current_date then raise exception 'La date ne peut pas être dans le futur.'; end if;
  if not p_whole_day and (p_from is null or (p_to is not null and p_to <= p_from)) then
    raise exception 'Indiquez les heures (la fin après le début).';
  end if;
  insert into public.life_events (student_id, kind, occurred_at, whole_day, detail, status, created_by)
  values (p_student, p_kind::public.life_event_kind,
          (p_day + coalesce(case when p_whole_day then null else p_from end, time '08:00')) at time zone 'Europe/Paris',
          p_whole_day,
          left(concat_ws(' · ', v_detail, case when p_whole_day then 'Journée entière'
            else to_char(p_from, 'HH24:MI') || coalesce('–' || to_char(p_to, 'HH24:MI'), '') end), 200),
          'a_justifier', private.me())
  returning id into v_id;
  if p_request then perform public.request_justification(v_id, null); end if;
  return v_id;
end $$;
revoke execute on function public.add_absence(uuid, text, date, boolean, time, time, text, boolean) from public, anon;
grant execute on function public.add_absence(uuid, text, date, boolean, time, time, text, boolean) to authenticated;
