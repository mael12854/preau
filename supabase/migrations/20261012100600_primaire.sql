-- École primaire : niveau de classe, matière « Questionner le monde », cahier de liaison.
-- Les évaluations gardent les 4 niveaux (type eval_value) ; seul l'affichage change
-- (libellés du livret scolaire : objectifs non atteints → dépassés).

alter type public.school_level add value if not exists 'primaire' before 'college';

insert into public.subjects (id, name, hue, skills) values
  ('qlm', 'Questionner le monde', 90, array['Observer', 'Expérimenter', 'Se repérer dans le temps et l''espace'])
on conflict (id) do nothing;

-- Mots de l'enseignant aux familles d'une classe.
create table public.liaison_notes (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  body text not null check (length(body) between 1 and 5000),
  requires_signature boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.liaison_notes (class_id, created_at desc);

-- « Lu et signé » par un responsable, pour un élève donné.
create table public.liaison_signatures (
  note_id uuid not null references public.liaison_notes (id) on delete cascade,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  signed_at timestamptz not null default now(),
  primary key (note_id, student_id)
);

alter table public.liaison_notes enable row level security;
alter table public.liaison_signatures enable row level security;
revoke all on public.liaison_notes, public.liaison_signatures from anon;
revoke insert, update, delete, truncate on public.liaison_notes, public.liaison_signatures from authenticated;
grant select on public.liaison_notes, public.liaison_signatures to authenticated;

create policy "mots des classes visibles" on public.liaison_notes for select to authenticated
  using ((select private.can_see_class(class_id)));

create policy "signatures : famille, enseignant, administration" on public.liaison_signatures for select to authenticated
  using ((select private.is_family_of(student_id))
      or exists (select 1 from public.liaison_notes n where n.id = note_id and n.author_id = (select private.me()))
      or (select private.is_admin_staff()));

-- Écrire un mot : enseignant de la classe.
create or replace function public.post_liaison_note(p_class uuid, p_title text, p_body text, p_requires_signature boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not private.teaches_class(p_class) then
    raise exception 'Seul l''enseignant de la classe peut écrire dans son cahier de liaison' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Indiquez un titre.'; end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'Écrivez votre mot avant de l''envoyer.'; end if;
  insert into public.liaison_notes (class_id, author_id, title, body, requires_signature)
  values (p_class, private.me(), trim(p_title), p_body, p_requires_signature) returning id into v_id;
  return v_id;
end $$;

-- Signer un mot : responsable d'un élève de la classe.
create or replace function public.sign_liaison_note(p_note uuid, p_student uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.liaison_notes n
    join public.students s on s.class_id = n.class_id and s.profile_id = p_student
    join public.guardians g on g.student_id = s.profile_id and g.guardian_id = private.me()
    where n.id = p_note and n.requires_signature
  ) then
    raise exception 'Mot introuvable' using errcode = '42501';
  end if;
  insert into public.liaison_signatures (note_id, student_id, guardian_id) values (p_note, p_student, private.me())
  on conflict do nothing;
end $$;

revoke all on function public.post_liaison_note(uuid, text, text, boolean) from public, anon;
revoke all on function public.sign_liaison_note(uuid, uuid) from public, anon;
grant execute on function public.post_liaison_note(uuid, text, text, boolean) to authenticated;
grant execute on function public.sign_liaison_note(uuid, uuid) to authenticated;
