-- Bulletins des établissements notés sur 20 : une note par matière (au demi-point), en plus de l'appréciation.
alter table public.report_card_lines
  add column if not exists score numeric(3, 1)
  check (score is null or (score between 0 and 20 and score * 2 = round(score * 2)));

-- Mêmes droits que set_report_line : la direction, ou le professeur qui enseigne la matière à l'élève.
create or replace function public.set_report_score(p_report_card uuid, p_subject text, p_score numeric)
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
  if p_score is not null and (p_score < 0 or p_score > 20 or p_score * 2 <> round(p_score * 2)) then
    raise exception 'Note invalide : de 0 à 20, au demi-point.';
  end if;
  insert into public.report_card_lines (report_card_id, subject_id, level, comment, position, updated_by, score)
  values (p_report_card, p_subject, 'NE', '',
          coalesce((select max(position) + 1 from public.report_card_lines where report_card_id = p_report_card), 0),
          private.me(), p_score)
  on conflict (report_card_id, subject_id) do update
    set score = excluded.score, updated_by = excluded.updated_by;
end $$;

revoke execute on function public.set_report_score(uuid, text, numeric) from public, anon;
grant execute on function public.set_report_score(uuid, text, numeric) to authenticated;
