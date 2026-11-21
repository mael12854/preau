-- Cahier de liaison : retirer un mot (son auteur, ou la direction et le secrétariat de l'établissement).
-- Le mot est masqué pour tout le monde (retrait logique) : il disparaît des cahiers, signatures comprises.
alter table public.liaison_notes add column if not exists removed_at timestamptz;

alter policy "mots des classes visibles" on public.liaison_notes
  using (removed_at is null and (select private.can_see_class(class_id)));

create or replace function public.remove_liaison_note(p_note uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.liaison_notes n set removed_at = now()
   where n.id = p_note and n.removed_at is null
     and (n.author_id = private.me()
          or (private.my_kind() in ('direction', 'secretariat')
              and exists (select 1 from public.classes c where c.id = n.class_id and c.school_id = private.my_school())));
  if not found then raise exception 'Mot introuvable' using errcode = '42501'; end if;
end $$;
revoke all on function public.remove_liaison_note(uuid) from public, anon;
grant execute on function public.remove_liaison_note(uuid) to authenticated;
