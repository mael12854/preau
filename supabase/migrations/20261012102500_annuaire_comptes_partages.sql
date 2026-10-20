-- Annuaire : le secrétariat et la direction voient quelles fiches de leur établissement partagent un compte.
create policy "fiches rattachées : administration de l'établissement" on public.profile_links for select to authenticated
  using ((select private.my_kind()) in ('secretariat', 'direction') and exists (
    select 1 from public.profiles p where p.id = profile_id and p.school_id = (select private.my_school())));
