-- Livret / bulletin : une matière compte dès qu'elle est positionnée ; l'appréciation devient facultative.
-- « Non positionné » (p_level nul) la garde en réserve sans l'afficher (niveau NE).
-- Établissements notés sur 20 (pas de positionnement) : c'est l'appréciation qui fait apparaître la matière.
create or replace function public.set_report_line(p_report_card uuid, p_subject text, p_level public.eval_value, p_comment text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_rc public.report_cards;
begin
  if private.me() is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  select * into v_rc from public.report_cards where id = p_report_card;
  if v_rc.id is null or not coalesce(
       (private.my_kind() = 'direction' and private.can_see_student(v_rc.student_id))
       or (private.my_kind() = 'prof' and private.teaches_subject_to(v_rc.student_id, p_subject)), false) then
    raise exception 'Bulletin introuvable' using errcode = '42501';
  end if;
  if p_level is not null and p_level not in ('MI', 'MF', 'MS', 'TB') then raise exception 'Positionnement invalide.'; end if;
  insert into public.report_card_lines (report_card_id, subject_id, level, comment, position, updated_by)
  values (p_report_card, p_subject, coalesce(p_level, 'NE'), coalesce(trim(p_comment), ''),
          coalesce((select max(position) + 1 from public.report_card_lines where report_card_id = p_report_card), 0), private.me())
  on conflict (report_card_id, subject_id) do update
    set level = excluded.level, comment = excluded.comment, updated_by = excluded.updated_by;
end $$;
