-- Titre des évaluations « Bilan RPP » : avec le nom de l'élève (la liste du professeur en compte une par rendez-vous).
create or replace function private.meeting_report_title() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.assessments a set title = 'Bilan RPP · ' || p.display_name
    from public.meeting_bookings b join public.profiles p on p.id = b.student_id
   where a.id = new.assessment_id and b.id = new.booking_id and a.title = 'Bilan RPP';
  return new;
end $$;
create trigger meeting_report_title after insert on public.meeting_report_scores
  for each row execute function private.meeting_report_title();
