-- Cahier de textes : contenu de séance (par cours) et pièces jointes (contenu de séance ou devoir).
-- Les fichiers vont dans le compartiment privé « documents » ; seul le serveur les sert, après contrôle de la RLS.

create table public.lesson_notes (
  lesson_id uuid primary key,                       -- pas de clé étrangère : le cours peut être retiré de l'emploi du temps
  class_id uuid not null references public.classes (id),
  subject_id text references public.subjects (id),
  teacher_id uuid not null references public.profiles (id),
  starts_at timestamptz not null,
  content text not null check (char_length(content) between 1 and 4000),
  updated_at timestamptz not null default now()
);
create index on public.lesson_notes (class_id, starts_at);
create index on public.lesson_notes (teacher_id, starts_at);

create table public.class_attachments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id),
  homework_id uuid,
  lesson_id uuid,
  name text not null check (char_length(name) between 1 and 200),
  storage_path text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  mime_type text not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  uploaded_at timestamptz,
  removed_at timestamptz,
  check ((homework_id is null) <> (lesson_id is null))
);
create index on public.class_attachments (homework_id);
create index on public.class_attachments (lesson_id);

alter table public.lesson_notes enable row level security;
alter table public.class_attachments enable row level security;

create policy "contenu de séance : classe" on public.lesson_notes for select to authenticated
  using ((select private.can_see_class(class_id)));

create policy "pièces jointes : comme le devoir ou la séance" on public.class_attachments for select to authenticated
  using (removed_at is null and (
       created_by = (select private.me())
    or (uploaded_at is not null and (
          (homework_id is not null and exists (select 1 from public.homework h where h.id = homework_id and private.can_see_class(h.class_id)))
       or (lesson_id is not null and exists (select 1 from public.lesson_notes n where n.lesson_id = class_attachments.lesson_id and private.can_see_class(n.class_id)))))));

revoke all on public.lesson_notes, public.class_attachments from anon;
revoke insert, update on public.lesson_notes, public.class_attachments from authenticated;

-- Contenu de séance : le professeur du cours.
create or replace function public.set_lesson_note(p_lesson uuid, p_content text)
returns void language plpgsql security definer set search_path = '' as $$
declare l public.lessons;
begin
  select * into l from public.lessons where id = p_lesson;
  if l.id is null or l.teacher_id is distinct from private.me() then
    raise exception 'Cours introuvable' using errcode = '42501';
  end if;
  if coalesce(trim(p_content), '') = '' or length(p_content) > 4000 then
    raise exception 'Décrivez le contenu de la séance (4 000 caractères au plus).';
  end if;
  insert into public.lesson_notes (lesson_id, class_id, subject_id, teacher_id, starts_at, content)
  values (l.id, l.class_id, l.subject_id, l.teacher_id, l.starts_at, trim(p_content))
  on conflict (lesson_id) do update set content = excluded.content, updated_at = now();
end $$;

-- Pièce jointe, étape 1 : le professeur du devoir ou de la séance ; le serveur délivre ensuite un lien d'envoi.
create or replace function public.create_class_attachment(
  p_homework uuid, p_lesson uuid, p_file_name text, p_size_bytes integer, p_mime_type text
) returns table (id uuid, storage_path text) language plpgsql security definer set search_path = '' as $$
declare v_id uuid := gen_random_uuid(); v_path text; v_school uuid := private.my_school();
  v_name text := regexp_replace(lower(coalesce(p_file_name, 'fichier')), '[^a-z0-9._-]+', '-', 'g');
begin
  if (p_homework is null) = (p_lesson is null) then raise exception 'Pièce jointe invalide.'; end if;
  if p_homework is not null and not exists (select 1 from public.homework h where h.id = p_homework and h.teacher_id = private.me()) then
    raise exception 'Devoir introuvable' using errcode = '42501';
  end if;
  if p_lesson is not null and not exists (select 1 from public.lesson_notes n where n.lesson_id = p_lesson and n.teacher_id = private.me()) then
    raise exception 'Enregistrez d''abord le contenu de la séance.' using errcode = '42501';
  end if;
  if p_size_bytes is null or p_size_bytes <= 0 or p_size_bytes > 10485760 then raise exception 'Le fichier doit faire 10 Mo au plus.'; end if;
  if (select count(*) from public.class_attachments a where a.removed_at is null
        and (a.homework_id = p_homework or a.lesson_id = p_lesson)) >= 10 then
    raise exception '10 pièces jointes au plus.';
  end if;
  v_path := v_school::text || '/pj/' || v_id::text || '/' || left(v_name, 120);
  insert into public.class_attachments (id, school_id, homework_id, lesson_id, name, storage_path, size_bytes, mime_type, created_by)
  values (v_id, v_school, p_homework, p_lesson, left(coalesce(nullif(trim(p_file_name), ''), 'fichier'), 200), v_path, p_size_bytes, coalesce(p_mime_type, ''), private.me());
  return query select v_id, v_path;
end $$;

-- Retirer une pièce jointe (son auteur) : renvoie le chemin du fichier, que le serveur efface du stockage.
create or replace function public.remove_class_attachment(p_attachment uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_path text;
begin
  update public.class_attachments set removed_at = now()
   where id = p_attachment and created_by = private.me() and removed_at is null
  returning storage_path into v_path;
  if v_path is null then raise exception 'Pièce jointe introuvable' using errcode = '42501'; end if;
  return v_path;
end $$;

revoke all on function public.set_lesson_note(uuid, text), public.create_class_attachment(uuid, uuid, text, integer, text),
  public.remove_class_attachment(uuid) from public, anon;
grant execute on function public.set_lesson_note(uuid, text), public.create_class_attachment(uuid, uuid, text, integer, text),
  public.remove_class_attachment(uuid) to authenticated;
